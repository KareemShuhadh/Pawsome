import {
	useContext,
	createContext,
	useEffect,
	useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

import { processImage } from "@/utils/imageUtils";
import {
	uploadImage,
	deleteImage,
} from "@/services/cloudinary.js";

const PostContext = createContext(null);

const fetchAllPosts = async () => {
	return supabase
		.from("posts")
		.select("*")
		.order("created_at", { ascending: false });
};

export const PostProvider = ({ children }) => {
	const { user, loading: authLoading } = useAuth();

	const [posts, setPosts] = useState([]);
	const [userPosts, setUserPosts] = useState([]);

	// Loading state for all posts (Home page)
	const [loading, setLoading] = useState(true);

	// Loading state for current user's posts
	const [userPostsLoading, setUserPostsLoading] =
		useState(true);

	/*
	 * Keeps track of which user's posts have actually
	 * finished loading.
	 *
	 * This prevents the UI from briefly thinking that
	 * the user has zero posts before the fetch starts.
	 */
	const [loadedUserId, setLoadedUserId] = useState(null);

	/*
	 * Load all posts once when PostProvider mounts.
	 *
	 * This is independent of authentication because
	 * everyone should be able to see posts on Home.
	 */
	useEffect(() => {
		const fetchInitialPosts = async () => {
			setLoading(true);

			const { data, error } = await fetchAllPosts();

			if (error) {
				console.error(
					"Error fetching posts:",
					error
				);

				setPosts([]);
			} else {
				setPosts(data || []);
			}

			setLoading(false);
		};

		fetchInitialPosts();
	}, []);

	/*
	 * Load posts created by the current user.
	 *
	 * Important:
	 * We don't consider the user's posts "loaded"
	 * until the request has actually finished.
	 */
	useEffect(() => {
		if (authLoading) return;

		/*
		 * No authenticated user.
		 */
		if (!user) {
			setUserPosts([]);
			setLoadedUserId(null);
			setUserPostsLoading(false);

			return;
		}

		const fetchUserPosts = async () => {
			setUserPostsLoading(true);

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", {
					ascending: false,
				});

			if (error) {
				console.error(
					"Error fetching user posts:",
					error
				);

				setUserPosts([]);
			} else {
				setUserPosts(data || []);
			}

			/*
			 * Only mark this user's posts as loaded
			 * AFTER the database request has finished.
			 */
			setLoadedUserId(user.id);

			setUserPostsLoading(false);
		};

		fetchUserPosts();
	}, [user, authLoading]);

	/*
	 * Derived loading state.
	 *
	 * Even if React hasn't run the effect yet,
	 * loadedUserId !== user.id tells us that we
	 * haven't loaded this user's posts yet.
	 */
	const isUserPostsLoading =
		authLoading ||
		(user
			? loadedUserId !== user.id
			: false);

	/*
	 * Create a post.
	 *
	 * Image flow:
	 *
	 * 1. Receive original image from UI
	 * 2. Optimize image
	 * 3. Convert to WebP
	 * 4. Upload optimized image to Cloudinary
	 * 5. Get image URL + public ID
	 * 6. Save those values in Supabase
	 */
	const addPost = async (post) => {
		if (!user) {
			return {
				data: null,
				error: new Error(
					"You must be logged in to create a post"
				),
			};
		}

		try {
			/*
			 * Remove the image File from the object
			 * that will be sent to Supabase.
			 */
			const { image, ...postData } = post;

			let imageUrl = null;
			let imagePublicId = null;

			/*
			 * Process the image before uploading.
			 */
			if (image) {
				const optimizedImage =
					await processImage(image);

				/*
				 * Upload optimized image to Cloudinary.
				 */
				const cloudinaryResult =
					await uploadImage(
						optimizedImage,
						supabase
					);

				imageUrl =
					cloudinaryResult.imageUrl;

				imagePublicId =
					cloudinaryResult.imagePublicId;
			}

			/*
			 * Create the database post.
			 */
			const { data, error } =
				await supabase
					.from("posts")
					.insert({
						...postData,
						user_id: user.id,
						votes: 0,
						image_url: imageUrl,
						image_public_id:
							imagePublicId,
					})
					.select()
					.single();

			if (error) {
				console.error(
					"Error creating post:",
					error
				);

				return {
					data: null,
					error,
				};
			}

			/*
			 * Update Home posts immediately.
			 */
			setPosts((currentPosts) => [
				data,
				...currentPosts,
			]);

			/*
			 * Update My Posts immediately.
			 */
			setUserPosts((currentPosts) => [
				data,
				...currentPosts,
			]);

			return {
				data,
				error: null,
			};
		} catch (error) {
			console.error(
				"Error creating post:",
				error
			);

			return {
				data: null,
				error,
			};
		}
	};

	/*
	 * Update a post.
	 *
	 * There are two possible flows:
	 *
	 * 1. No new image:
	 *    - Update only the normal post fields.
	 *    - Do NOT contact Cloudinary.
	 *
	 * 2. New image selected:
	 *    - Get the old image_public_id.
	 *    - Process the new image.
	 *    - Upload the new image to Cloudinary.
	 *    - Update Supabase with the new URL/public ID.
	 *    - Delete the old Cloudinary image.
	 */
	const updatePost = async (id, updates) => {
		if (!user) {
			return {
				data: null,
				error: new Error(
					"You must be logged in to update a post"
				),
			};
		}

		try {
			/*
			 * Separate the image File from the fields
			 * that will actually be sent to Supabase.
			 *
			 * The image File must NEVER be sent directly
			 * to the posts table.
			 */
			const { image, ...postData } = updates;

			/*
			 * --------------------------------------------------
			 * CASE 1:
			 * No new image was selected.
			 *
			 * This is the normal text-only edit.
			 * Cloudinary is completely untouched.
			 * --------------------------------------------------
			 */
			if (!image) {
				const { data, error } =
					await supabase
						.from("posts")
						.update(postData)
						.eq("id", id)
						.eq("user_id", user.id)
						.select()
						.single();

				if (!error && data) {
					/*
					 * Update Home immediately.
					 */
					setPosts((currentPosts) =>
						currentPosts.map((post) =>
							post.id === id
								? data
								: post
						)
					);

					/*
					 * Update My Posts immediately.
					 */
					setUserPosts((currentPosts) =>
						currentPosts.map((post) =>
							post.id === id
								? data
								: post
						)
					);
				}

				return {
					data,
					error,
				};
			}

			/*
			 * --------------------------------------------------
			 * CASE 2:
			 * A new image was selected.
			 * --------------------------------------------------
			 */

			/*
			 * 1. Get the existing post's Cloudinary
			 * public ID.
			 *
			 * We need this BEFORE replacing the database
			 * values so we still know which old image
			 * needs to be deleted.
			 */
			const {
				data: existingPost,
				error: fetchError,
			} = await supabase
				.from("posts")
				.select("image_public_id")
				.eq("id", id)
				.eq("user_id", user.id)
				.single();

			if (fetchError) {
				console.error(
					"Error finding post before image update:",
					fetchError
				);

				return {
					data: null,
					error: fetchError,
				};
			}

			const oldImagePublicId =
				existingPost?.image_public_id || null;

			/*
			 * 2. Process the new image using the SAME
			 * image optimization pipeline used by addPost().
			 */
			const optimizedImage =
				await processImage(image);

			/*
			 * 3. Upload the optimized image to Cloudinary.
			 */
			const cloudinaryResult =
				await uploadImage(
					optimizedImage,
					supabase
				);

			const newImageUrl =
				cloudinaryResult.imageUrl;

			const newImagePublicId =
				cloudinaryResult.imagePublicId;

			/*
			 * 4. Update the database with the NEW
			 * image URL and NEW public ID.
			 */
			const { data, error } =
				await supabase
					.from("posts")
					.update({
						...postData,
						image_url: newImageUrl,
						image_public_id:
							newImagePublicId,
					})
					.eq("id", id)
					.eq("user_id", user.id)
					.select()
					.single();

			/*
			 * If the database update failed, the new image
			 * is now unnecessary in Cloudinary.
			 *
			 * Try to clean it up so we don't leave
			 * an orphaned Cloudinary image.
			 */
			if (error) {
				console.error(
					"Error updating post after new image upload:",
					error
				);

				try {
					await deleteImage(
						newImagePublicId,
						supabase
					);
				} catch (cleanupError) {
					console.error(
						"Failed to clean up newly uploaded image:",
						cleanupError
					);
				}

				return {
					data: null,
					error,
				};
			}

			/*
			 * 5. The database now points to the new image.
			 *
			 * We can safely remove the OLD image from
			 * Cloudinary.
			 */
			if (
				oldImagePublicId &&
				oldImagePublicId !== newImagePublicId
			) {
				try {
					await deleteImage(
						oldImagePublicId,
						supabase
					);
				} catch (deleteError) {
					/*
					 * The post update itself succeeded.
					 *
					 * If old-image deletion fails, we keep
					 * the new image and log the problem.
					 * The old image may remain in Cloudinary
					 * and can be cleaned up later.
					 */
					console.error(
						"Post updated, but failed to delete old Cloudinary image:",
						deleteError
					);
				}
			}

			/*
			 * 6. Update Home immediately.
			 */
			setPosts((currentPosts) =>
				currentPosts.map((post) =>
					post.id === id
						? data
						: post
				)
			);

			/*
			 * 7. Update My Posts immediately.
			 */
			setUserPosts((currentPosts) =>
				currentPosts.map((post) =>
					post.id === id
						? data
						: post
				)
			);

			return {
				data,
				error: null,
			};
		} catch (error) {
			console.error(
				"Error updating post:",
				error
			);

			return {
				data: null,
				error,
			};
		}
	};

	/*
	 * Delete a post.
	 *
	 * Flow:
	 *
	 * 1. Find post
	 * 2. Get image_public_id
	 * 3. Delete image from Cloudinary
	 * 4. Delete post from Supabase
	 * 5. Update local state
	 */
	const deletePost = async (id) => {
		if (!user) {
			return {
				error: new Error(
					"You must be logged in to delete a post"
				),
			};
		}

		try {
			/*
			 * 1. Get the post first so we can get
			 * the Cloudinary public ID.
			 */
			const {
				data: post,
				error: fetchError,
			} = await supabase
				.from("posts")
				.select("image_public_id")
				.eq("id", id)
				.eq("user_id", user.id)
				.single();

			if (fetchError) {
				console.error(
					"Error finding post:",
					fetchError
				);

				return {
					error: fetchError,
				};
			}

			/*
			 * 2. Delete image from Cloudinary.
			 */
			if (post?.image_public_id) {
				await deleteImage(
					post.image_public_id,
					supabase
				);
			}

			/*
			 * 3. Delete the post from Supabase.
			 */
			const { error } = await supabase
				.from("posts")
				.delete()
				.eq("id", id)
				.eq("user_id", user.id);

			if (error) {
				console.error(
					"Error deleting post:",
					error
				);

				return { error };
			}

			/*
			 * 4. Remove from Home immediately.
			 */
			setPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			/*
			 * 5. Remove from My Posts immediately.
			 */
			setUserPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			return {
				error: null,
			};
		} catch (error) {
			console.error(
				"Error deleting post:",
				error
			);

			return {
				error,
			};
		}
	};

	/*
	 * Apply a vote count change locally.
	 */
	const applyVoteDelta = (postId, delta) => {
		const adjust = (post) =>
			post.id === postId
				? {
						...post,
						votes: Math.max(
							0,
							(post.votes ?? 0) +
								delta
						),
				  }
				: post;

		setPosts((currentPosts) =>
			currentPosts.map(adjust)
		);

		setUserPosts((currentPosts) =>
			currentPosts.map(adjust)
		);
	};

	return (
		<PostContext.Provider
			value={{
				posts,
				userPosts,

				loading,

				/*
				 * Use the derived loading state here.
				 */
				userPostsLoading:
					isUserPostsLoading,

				addPost,
				updatePost,
				deletePost,
				applyVoteDelta,
			}}
		>
			{children}
		</PostContext.Provider>
	);
};

export const usePosts = () => {
	const context = useContext(PostContext);

	if (!context) {
		throw new Error(
			"usePosts must be used inside PostProvider"
		);
	}

	return context;
};