import {
	createContext,
	useContext,
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

/*
 * ======================================================
 * CONFIG
 * ======================================================
 */

const POSTS_PER_PAGE = 2;

/*
 * ======================================================
 * FETCH TOP POSTS
 * ======================================================
 */

const fetchTopPosts = async () => {
	return supabase
		.from("posts")
		.select("*")
		.order("votes", {
			ascending: false,
		})
		.order("created_at", {
			ascending: false,
		})
		.limit(3);
};

/*
 * ======================================================
 * FETCH FIRST FRESH PAGE
 * ======================================================
 */

const fetchInitialFreshPosts = async () => {
	return supabase
		.from("posts")
		.select("*")
		.order("created_at", {
			ascending: false,
		})
		.order("id", {
			ascending: false,
		})
		.limit(POSTS_PER_PAGE);
};

/*
 * ======================================================
 * FETCH MORE FRESH POSTS
 * ======================================================
 */

const fetchMoreFreshPosts = async (
	lastCreatedAt,
	lastId
) => {
	let query = supabase
		.from("posts")
		.select("*")
		.order("created_at", {
			ascending: false,
		})
		.order("id", {
			ascending: false,
		})
		.limit(POSTS_PER_PAGE);

	query = query.or(
		`created_at.lt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`
	);

	return query;
};

export const PostProvider = ({ children }) => {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	/*
	 * ======================================================
	 * HOME POSTS
	 * ======================================================
	 */

	const [posts, setPosts] = useState([]);

	const [topPosts, setTopPosts] = useState([]);

	const [loading, setLoading] = useState(true);

	const [loadingMore, setLoadingMore] =
		useState(false);

	const [hasMore, setHasMore] = useState(true);

	/*
	 * ======================================================
	 * FRESH PAGINATION CURSOR
	 * ======================================================
	 */

	const [freshCursor, setFreshCursor] =
		useState(null);

	/*
	 * ======================================================
	 * USER POSTS
	 * ======================================================
	 */

	const [userPosts, setUserPosts] = useState([]);

	const [userPostsLoading, setUserPostsLoading] =
		useState(true);

	const [loadedUserId, setLoadedUserId] =
		useState(null);

	/*
	 * ======================================================
	 * REFRESH TOP POSTS
	 * ======================================================
	 */

	const refreshTopPosts = async () => {
		const {
			data,
			error,
		} = await fetchTopPosts();

		if (error) {
			console.error(
				"Error refreshing top posts:",
				error
			);

			return {
				data: [],
				error,
			};
		}

		const safeTopPosts = data || [];

		setTopPosts(safeTopPosts);

		return {
			data: safeTopPosts,
			error: null,
		};
	};

	/*
	 * ======================================================
	 * INITIAL HOME LOAD
	 * ======================================================
	 */

	useEffect(() => {
		let cancelled = false;

		const fetchInitialPosts = async () => {
			setLoading(true);

			setPosts([]);
			setTopPosts([]);
			setFreshCursor(null);
			setHasMore(true);

			/*
			 * ----------------------------------------------
			 * FETCH TOP 3
			 * ----------------------------------------------
			 */

			const {
				data: fetchedTopPosts,
				error: topPostsError,
			} = await fetchTopPosts();

			if (cancelled) return;

			if (topPostsError) {
				console.error(
					"Error fetching top posts:",
					topPostsError
				);

				setTopPosts([]);
			} else {
				setTopPosts(
					fetchedTopPosts || []
				);
			}

			/*
			 * ----------------------------------------------
			 * FETCH FIRST FRESH PAGE
			 * ----------------------------------------------
			 */

			const {
				data: fetchedFreshPosts,
				error: freshPostsError,
			} = await fetchInitialFreshPosts();

			if (cancelled) return;

			if (freshPostsError) {
				console.error(
					"Error fetching fresh posts:",
					freshPostsError
				);

				setPosts([]);
				setHasMore(false);
				setFreshCursor(null);
			} else {
				const freshData =
					fetchedFreshPosts || [];

				setPosts(freshData);

				if (
					freshData.length <
					POSTS_PER_PAGE
				) {
					setHasMore(false);
				} else {
					const lastPost =
						freshData[
							freshData.length - 1
						];

					const {
						data: nextPostCheck,
						error: nextPostError,
					} = await fetchMoreFreshPosts(
						lastPost.created_at,
						lastPost.id
					);

					if (cancelled) return;

					if (nextPostError) {
						console.error(
							"Error checking for more fresh posts:",
							nextPostError
						);

						setHasMore(false);
					} else {
						setHasMore(
							(nextPostCheck || [])
								.length > 0
						);
					}
				}

				/*
				 * Save cursor.
				 */

				if (freshData.length > 0) {
					const lastPost =
						freshData[
							freshData.length - 1
						];

					setFreshCursor({
						created_at:
							lastPost.created_at,
						id: lastPost.id,
					});
				} else {
					setFreshCursor(null);
				}
			}

			setLoading(false);
		};

		fetchInitialPosts();

		return () => {
			cancelled = true;
		};
	}, []);

	/*
	 * ======================================================
	 * REALTIME POSTS
	 * ======================================================
	 *
	 * This listens to the `posts` table.
	 *
	 * INSERT:
	 *   Another browser created a post.
	 *
	 * UPDATE:
	 *   Another browser changed a post.
	 *
	 *   IMPORTANT:
	 *
	 *   Vote changes arrive here because the PostgreSQL
	 *   trigger updates posts.votes.
	 *
	 * DELETE:
	 *   Another browser deleted a post.
	 *
	 * The database row is ALWAYS treated as the source
	 * of truth.
	 */

	useEffect(() => {
		const channel = supabase
			.channel("posts-realtime")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "posts",
				},
				(payload) => {
					const newPost =
						payload.new;

					if (!newPost?.id) {
						return;
					}

					console.log(
						"Realtime posts INSERT:",
						newPost
					);

					/*
					 * ------------------------------------------
					 * FRESH PUPS
					 * ------------------------------------------
					 *
					 * New posts are newest, so put them first.
					 *
					 * Prevent duplicate because addPost()
					 * may already have inserted it locally.
					 */

					setPosts((currentPosts) => {
						const alreadyExists =
							currentPosts.some(
								(post) =>
									post.id ===
									newPost.id
							);

						if (alreadyExists) {
							return currentPosts;
						}

						return [
							newPost,
							...currentPosts,
						];
					});

					/*
					 * ------------------------------------------
					 * MY POSTS
					 * ------------------------------------------
					 */

					if (
						user?.id &&
						newPost.user_id ===
							user.id
					) {
						setUserPosts(
							(currentPosts) => {
								const alreadyExists =
									currentPosts.some(
										(post) =>
											post.id ===
											newPost.id
									);

								if (
									alreadyExists
								) {
									return currentPosts;
								}

								return [
									newPost,
									...currentPosts,
								];
							}
						);
					}

					/*
					 * A new post could affect Top Dogs.
					 *
					 * Fetch the real global Top 3.
					 */

					refreshTopPosts();
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "posts",
				},
				(payload) => {
					const updatedPost =
						payload.new;

					if (!updatedPost?.id) {
						return;
					}

					console.log(
						"Realtime posts UPDATE:",
						updatedPost
					);

					/*
					 * ------------------------------------------
					 * FRESH PUPS
					 * ------------------------------------------
					 *
					 * Replace the complete row.
					 *
					 * This is important.
					 *
					 * We DO NOT do:
					 *
					 * votes + 1
					 *
					 * or:
					 *
					 * votes - 1
					 *
					 * PostgreSQL already calculated the
					 * authoritative count.
					 */

					setPosts((currentPosts) =>
						currentPosts.map(
							(post) =>
								post.id ===
								updatedPost.id
									? updatedPost
									: post
						)
					);

					/*
					 * ------------------------------------------
					 * MY POSTS
					 * ------------------------------------------
					 */

					setUserPosts((currentPosts) =>
						currentPosts.map(
							(post) =>
								post.id ===
								updatedPost.id
									? updatedPost
									: post
						)
					);

					/*
					 * ------------------------------------------
					 * TOP DOGS
					 * ------------------------------------------
					 *
					 * Re-fetch the real global Top 3.
					 *
					 * This handles a post entering/leaving
					 * the Top 3 because of a vote.
					 */

					refreshTopPosts();
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "posts",
				},
				(payload) => {
					const deletedPost =
						payload.old;

					if (!deletedPost?.id) {
						return;
					}

					console.log(
						"Realtime posts DELETE:",
						deletedPost
					);

					/*
					 * Remove from Fresh Pups.
					 */

					setPosts((currentPosts) =>
						currentPosts.filter(
							(post) =>
								post.id !==
								deletedPost.id
						)
					);

					/*
					 * Remove from My Posts.
					 */

					setUserPosts((currentPosts) =>
						currentPosts.filter(
							(post) =>
								post.id !==
								deletedPost.id
						)
					);

					/*
					 * Remove from Top Dogs.
					 */

					setTopPosts(
						(currentTopPosts) =>
							currentTopPosts.filter(
								(post) =>
									post.id !==
									deletedPost.id
							)
					);

					/*
					 * Re-fetch Top Dogs because another
					 * post may now enter the Top 3.
					 */

					refreshTopPosts();
				}
			)
			.subscribe((status) => {
				console.log(
					"Posts realtime status:",
					status
				);
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id]);

	/*
	 * ======================================================
	 * LOAD MORE FRESH POSTS
	 * ======================================================
	 */

	const loadMorePosts = async () => {
		if (
			loadingMore ||
			!hasMore ||
			!freshCursor
		) {
			return {
				data: [],
				error: null,
			};
		}

		setLoadingMore(true);

		try {
			const {
				data,
				error,
			} = await fetchMoreFreshPosts(
				freshCursor.created_at,
				freshCursor.id
			);

			if (error) {
				console.error(
					"Error loading more posts:",
					error
				);

				return {
					data: [],
					error,
				};
			}

			const freshData = data || [];

			if (freshData.length === 0) {
				setHasMore(false);

				return {
					data: [],
					error: null,
				};
			}

			setPosts((currentPosts) => {
				const existingIds = new Set(
					currentPosts.map(
						(post) => post.id
					)
				);

				const uniqueNewPosts =
					freshData.filter(
						(post) =>
							!existingIds.has(
								post.id
							)
					);

				return [
					...currentPosts,
					...uniqueNewPosts,
				];
			});

			const lastPost =
				freshData[
					freshData.length - 1
				];

			setFreshCursor({
				created_at:
					lastPost.created_at,
				id: lastPost.id,
			});

			setHasMore(
				freshData.length ===
					POSTS_PER_PAGE
			);

			return {
				data: freshData,
				error: null,
			};
		} catch (error) {
			console.error(
				"Error loading more posts:",
				error
			);

			return {
				data: [],
				error,
			};
		} finally {
			setLoadingMore(false);
		}
	};

	/*
	 * ======================================================
	 * USER POSTS
	 * ======================================================
	 */

	useEffect(() => {
		if (authLoading) return;

		if (!user) {
			setUserPosts([]);
			setLoadedUserId(null);
			setUserPostsLoading(false);

			return;
		}

		const fetchUserPosts = async () => {
			setUserPostsLoading(true);

			const {
				data,
				error,
			} = await supabase
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

			setLoadedUserId(user.id);

			setUserPostsLoading(false);
		};

		fetchUserPosts();
	}, [user, authLoading]);

	const isUserPostsLoading =
		authLoading ||
		(user
			? loadedUserId !== user.id
			: false);

	/*
	 * ======================================================
	 * CREATE POST
	 * ======================================================
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
			const {
				image,
				...postData
			} = post;

			let imageUrl = null;
			let imagePublicId = null;

			if (image) {
				const optimizedImage =
					await processImage(image);

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

			const {
				data,
				error,
			} = await supabase
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
			 * Keep the local UI responsive.
			 *
			 * Realtime will also receive the INSERT,
			 * but its handler prevents duplicates.
			 */

			setPosts((currentPosts) => {
				const alreadyExists =
					currentPosts.some(
						(existingPost) =>
							existingPost.id ===
							data.id
					);

				if (alreadyExists) {
					return currentPosts;
				}

				return [
					data,
					...currentPosts,
				];
			});

			setUserPosts((currentPosts) => {
				const alreadyExists =
					currentPosts.some(
						(existingPost) =>
							existingPost.id ===
							data.id
					);

				if (alreadyExists) {
					return currentPosts;
				}

				return [
					data,
					...currentPosts,
				];
			});

			await refreshTopPosts();

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
	 * ======================================================
	 * UPDATE POST
	 * ======================================================
	 */

	const updatePost = async (
		id,
		updates
	) => {
		if (!user) {
			return {
				data: null,
				error: new Error(
					"You must be logged in to update a post"
				),
			};
		}

		try {
			const {
				image,
				...postData
			} = updates;

			/*
			 * ----------------------------------------------
			 * NO NEW IMAGE
			 * ----------------------------------------------
			 */

			if (!image) {
				const {
					data,
					error,
				} = await supabase
					.from("posts")
					.update(postData)
					.eq("id", id)
					.eq("user_id", user.id)
					.select()
					.single();

				if (error) {
					console.error(
						"Error updating post:",
						error
					);

					return {
						data: null,
						error,
					};
				}

				setPosts((currentPosts) =>
					currentPosts.map(
						(post) =>
							post.id === id
								? data
								: post
					)
				);

				setUserPosts(
					(currentPosts) =>
						currentPosts.map(
							(post) =>
								post.id ===
								id
									? data
									: post
						)
				);

				await refreshTopPosts();

				return {
					data,
					error: null,
				};
			}

			/*
			 * ----------------------------------------------
			 * NEW IMAGE
			 * ----------------------------------------------
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
				existingPost?.image_public_id ||
				null;

			const optimizedImage =
				await processImage(image);

			const cloudinaryResult =
				await uploadImage(
					optimizedImage,
					supabase
				);

			const newImageUrl =
				cloudinaryResult.imageUrl;

			const newImagePublicId =
				cloudinaryResult.imagePublicId;

			const {
				data,
				error,
			} = await supabase
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

			if (
				oldImagePublicId &&
				oldImagePublicId !==
					newImagePublicId
			) {
				try {
					await deleteImage(
						oldImagePublicId,
						supabase
					);
				} catch (deleteError) {
					console.error(
						"Post updated, but failed to delete old Cloudinary image:",
						deleteError
					);
				}
			}

			setPosts((currentPosts) =>
				currentPosts.map((post) =>
					post.id === id
						? data
						: post
				)
			);

			setUserPosts((currentPosts) =>
				currentPosts.map((post) =>
					post.id === id
						? data
						: post
				)
			);

			await refreshTopPosts();

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
	 * ======================================================
	 * DELETE POST
	 * ======================================================
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

			if (post?.image_public_id) {
				await deleteImage(
					post.image_public_id,
					supabase
				);
			}

			const {
				error,
			} = await supabase
				.from("posts")
				.delete()
				.eq("id", id)
				.eq("user_id", user.id);

			if (error) {
				console.error(
					"Error deleting post:",
					error
				);

				return {
					error,
				};
			}

			/*
			 * Local update.
			 *
			 * Realtime will also send DELETE,
			 * but filtering is idempotent.
			 */

			setPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			setUserPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			setTopPosts((currentTopPosts) =>
				currentTopPosts.filter(
					(post) => post.id !== id
				)
			);

			await refreshTopPosts();

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
	 * ======================================================
	 * APPLY VOTE DELTA
	 * ======================================================
	 *
	 * IMPORTANT:
	 *
	 * Realtime now handles vote-count synchronization.
	 *
	 * PostgreSQL is responsible for:
	 *
	 * votes table
	 *      ↓
	 * trigger
	 *      ↓
	 * posts.votes
	 *      ↓
	 * Realtime
	 *
	 * Therefore this function should NOT be called
	 * after voting anymore.
	 *
	 * It remains here temporarily so existing components
	 * that import it do not immediately break.
	 */

	const applyVoteDelta = async () => {
		/*
		 * Do nothing.
		 *
		 * The database + Realtime now owns this.
		 */
		return;
	};

	/*
	 * ======================================================
	 * PROVIDER
	 * ======================================================
	 */

	return (
		<PostContext.Provider
			value={{
				posts,

				topPosts,

				loading,

				loadingMore,

				hasMore,

				loadMorePosts,

				refreshTopPosts,

				userPosts,

				userPostsLoading:
					isUserPostsLoading,

				addPost,
				updatePost,
				deletePost,

				/*
				 * Kept for compatibility.
				 *
				 * Do not use this for vote synchronization.
				 */
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