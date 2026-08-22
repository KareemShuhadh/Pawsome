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

/*
 * ======================================================
 * CONFIG
 * ======================================================
 */

/*
 * Number of Fresh Pups loaded per request.
 *
 * You can change this to 20 in production.
 */
const POSTS_PER_PAGE = 2;

/*
 * ======================================================
 * FETCH TOP POSTS
 * ======================================================
 *
 * Top Dogs are GLOBAL.
 *
 * They are completely independent from Fresh Pups.
 *
 * A post does NOT need to be inside the user's currently
 * loaded Fresh Pups feed to appear here.
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
 *
 * Gets the newest Fresh Pups.
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
 *
 * Cursor pagination.
 *
 * We fetch posts OLDER than the last post already
 * loaded.
 *
 * This is much safer than offset pagination because
 * new posts can be inserted at the beginning without
 * changing the meaning of the next page.
 *
 * created_at + id are used together as the cursor.
 *
 * `id` is the tie-breaker in case two posts have the
 * exact same created_at timestamp.
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

	/*
	 * We want:
	 *
	 * created_at < lastCreatedAt
	 *
	 * OR
	 *
	 * created_at = lastCreatedAt AND id < lastId
	 *
	 * This continues exactly where the previous page
	 * stopped.
	 */
	query = query.or(
		`created_at.lt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`
	);

	return query;
};

export const PostProvider = ({ children }) => {
	const { user, loading: authLoading } = useAuth();

	/*
	 * ======================================================
	 * HOME POSTS
	 * ======================================================
	 */

	/*
	 * Fresh Pups already loaded into this user's feed.
	 *
	 * IMPORTANT:
	 *
	 * This array is independent from Top Dogs.
	 *
	 * Voting does not add/remove posts here.
	 */
	const [posts, setPosts] = useState([]);

	/*
	 * Current GLOBAL Top 3.
	 */
	const [topPosts, setTopPosts] = useState([]);

	/*
	 * Initial Home loading.
	 */
	const [loading, setLoading] = useState(true);

	/*
	 * Load More loading.
	 */
	const [loadingMore, setLoadingMore] =
		useState(false);

	/*
	 * Whether older Fresh Pups are available.
	 */
	const [hasMore, setHasMore] = useState(true);

	/*
	 * ======================================================
	 * FRESH PAGINATION CURSOR
	 * ======================================================
	 *
	 * Instead of an offset, we remember the last post
	 * that was loaded.
	 *
	 * Example:
	 *
	 * Fresh:
	 *
	 * A
	 * B
	 *
	 * Cursor = B
	 *
	 * Load More asks:
	 *
	 * "Give me posts older than B."
	 *
	 * This remains correct even if new posts are added
	 * above A.
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
	 *
	 * ONLY refreshes Top Dogs.
	 *
	 * It NEVER changes:
	 *
	 * - posts
	 * - freshCursor
	 * - hasMore
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
	 *
	 * Loads:
	 *
	 * 1. Global Top 3
	 * 2. First Fresh Pups page
	 *
	 * These are independent.
	 */
	useEffect(() => {
		let cancelled = false;

		const fetchInitialPosts = async () => {
			setLoading(true);

			/*
			 * Reset Home state.
			 */
			setPosts([]);
			setTopPosts([]);
			setFreshCursor(null);
			setHasMore(true);

			/*
			 * ----------------------------------------------
			 * FETCH GLOBAL TOP 3
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

				/*
				 * If we received a full page, there MAY
				 * be another page.
				 *
				 * We cannot know for certain without
				 * asking for one more record.
				 *
				 * So we check for one extra record below.
				 */
				if (
					freshData.length <
					POSTS_PER_PAGE
				) {
					/*
					 * Fewer than a full page means we
					 * definitely reached the end.
					 */
					setHasMore(false);
				} else {
					/*
					 * We got a full page.
					 *
					 * Check whether an older post exists.
					 */
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
				 * Save the last loaded post as the cursor.
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
	 * LOAD MORE FRESH POSTS
	 * ======================================================
	 *
	 * Uses the cursor.
	 *
	 * This is the important fix.
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

			/*
			 * Nothing older exists.
			 */
			if (freshData.length === 0) {
				setHasMore(false);

				return {
					data: [],
					error: null,
				};
			}

			/*
			 * Add older posts to the END.
			 *
			 * IMPORTANT:
			 *
			 * We don't replace the existing feed.
			 */
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

			/*
			 * Move cursor to the last returned post.
			 */
			const lastPost =
				freshData[
					freshData.length - 1
				];

			setFreshCursor({
				created_at:
					lastPost.created_at,
				id: lastPost.id,
			});

			/*
			 * If we received fewer than a full page,
			 * we reached the end.
			 *
			 * If we received exactly a full page,
			 * keep the button available.
			 *
			 * The next request will definitively tell us
			 * whether another page exists.
			 */
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

			/*
			 * Process and upload image.
			 */
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

			/*
			 * Create database post.
			 */
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
			 * ==================================================
			 * FRESH PUPS
			 * ==================================================
			 *
			 * New posts are the newest posts.
			 *
			 * Put it at the beginning.
			 *
			 * IMPORTANT:
			 *
			 * We do NOT modify the cursor.
			 *
			 * The cursor represents the OLDEST post loaded,
			 * not the number of items in the array.
			 *
			 * This is one of the major benefits of cursor
			 * pagination.
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

			/*
			 * A new post exists, so even if the user had
			 * previously reached the end, the feed now
			 * has a new item.
			 *
			 * HOWEVER:
			 *
			 * The new item is already inserted directly
			 * into Fresh Pups, so we don't need to change
			 * the cursor or fetch it again.
			 */
			setHasMore((currentHasMore) => {
				/*
				 * If there were already older posts,
				 * preserve the current state.
				 */
				return currentHasMore;
			});

			/*
			 * Add to My Posts.
			 */
			setUserPosts((currentPosts) => [
				data,
				...currentPosts,
			]);

			/*
			 * Refresh global Top Dogs.
			 */
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
			 * CASE 1: NO NEW IMAGE
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

				/*
				 * Update Fresh Pups ONLY if it is already
				 * loaded.
				 */
				setPosts((currentPosts) =>
					currentPosts.map(
						(post) =>
							post.id === id
								? data
								: post
					)
				);

				/*
				 * Update My Posts.
				 */
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

				/*
				 * Top Dogs are global.
				 */
				await refreshTopPosts();

				return {
					data,
					error: null,
				};
			}

			/*
			 * ----------------------------------------------
			 * CASE 2: NEW IMAGE
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

			/*
			 * Delete old image.
			 */
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

			/*
			 * Update Fresh Pups ONLY if already loaded.
			 */
			setPosts((currentPosts) =>
				currentPosts.map((post) =>
					post.id === id
						? data
						: post
				)
			);

			/*
			 * Update My Posts.
			 */
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
			/*
			 * Get Cloudinary public ID.
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
			 * Delete Cloudinary image.
			 */
			if (post?.image_public_id) {
				await deleteImage(
					post.image_public_id,
					supabase
				);
			}

			/*
			 * Delete database post.
			 */
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
			 * Remove from Fresh Pups if loaded.
			 *
			 * DO NOT modify the cursor.
			 *
			 * The cursor belongs to the last position
			 * in the chronological feed, not the number
			 * of loaded array items.
			 */
			setPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			/*
			 * Remove from My Posts.
			 */
			setUserPosts((currentPosts) =>
				currentPosts.filter(
					(post) => post.id !== id
				)
			);

			/*
			 * Remove from current Top Dogs.
			 */
			setTopPosts((currentTopPosts) =>
				currentTopPosts.filter(
					(post) => post.id !== id
				)
			);

			/*
			 * Refresh global Top Dogs.
			 */
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
	 * Voting NEVER changes Fresh Pups membership.
	 *
	 * If the post is loaded in Fresh Pups:
	 *
	 *   update its vote count
	 *
	 * If it is NOT loaded:
	 *
	 *   do nothing to Fresh Pups
	 *
	 * Top Dogs are refreshed globally.
	 */
	const applyVoteDelta = async (
		postId,
		delta
	) => {
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

		/*
		 * ----------------------------------------------
		 * FRESH PUPS
		 * ----------------------------------------------
		 *
		 * Only update the vote count.
		 *
		 * NEVER add/remove/reorder.
		 */
		setPosts((currentPosts) =>
			currentPosts.map(adjust)
		);

		/*
		 * ----------------------------------------------
		 * MY POSTS
		 * ----------------------------------------------
		 */
		setUserPosts((currentPosts) =>
			currentPosts.map(adjust)
		);

		/*
		 * ----------------------------------------------
		 * TOP DOGS
		 * ----------------------------------------------
		 *
		 * First make the UI responsive.
		 */
		setTopPosts((currentTopPosts) =>
			currentTopPosts
				.map(adjust)
				.sort((a, b) => {
					const voteDifference =
						(b.votes ?? 0) -
						(a.votes ?? 0);

					if (
						voteDifference !==
						0
					) {
						return voteDifference;
					}

					return (
						new Date(
							b.created_at
						) -
						new Date(
							a.created_at
						)
					);
				})
		);

		/*
		 * ----------------------------------------------
		 * GLOBAL TOP 3 REFRESH
		 * ----------------------------------------------
		 *
		 * This is critical.
		 *
		 * Suppose User A only loaded posts 1-20.
		 *
		 * Post 22 is NOT in their Fresh Pups.
		 *
		 * User B votes for post 22.
		 *
		 * Post 22 becomes a Top Dog.
		 *
		 * User A can now see post 22 in Top Dogs,
		 * even though post 22 is not in Fresh Pups.
		 *
		 * It is NOT inserted into Fresh Pups.
		 */
		await refreshTopPosts();
	};

	/*
	 * ======================================================
	 * PROVIDER
	 * ======================================================
	 */
	return (
		<PostContext.Provider
			value={{
				/*
				 * Fresh Pups
				 */
				posts,

				/*
				 * Global Top Dogs
				 */
				topPosts,

				/*
				 * Initial loading
				 */
				loading,

				/*
				 * Load More loading
				 */
				loadingMore,

				/*
				 * Older Fresh Pups available
				 */
				hasMore,

				/*
				 * Load older Fresh Pups
				 */
				loadMorePosts,

				/*
				 * Refresh Top Dogs
				 */
				refreshTopPosts,

				/*
				 * User posts
				 */
				userPosts,

				/*
				 * User posts loading
				 */
				userPostsLoading:
					isUserPostsLoading,

				/*
				 * CRUD
				 */
				addPost,
				updatePost,
				deletePost,

				/*
				 * Voting
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
