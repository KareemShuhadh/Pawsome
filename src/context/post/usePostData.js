import {
	useCallback,
	useEffect,
	useState,
} from "react";

import {
	POSTS_PER_PAGE,
	fetchTopPosts,
	fetchMoreFreshPosts,
} from "./postQueries";

import {
	fetchInitialFeed,
	fetchUserPostData,
} from "./postData";

import {
	getPostCursor,
	mergeUniquePosts,
	prependUniquePost,
	replacePost,
	removePost,
	updatePostVotes,
} from "./postHelpers";

import {
	createPostMutation,
	updatePostMutation,
	deletePostMutation,
} from "./postMutations";

export const usePostData = ({
	user,
	authLoading,
}) => {
	/* ============================================================
	 * STATE
	 * ============================================================ */

	const [posts, setPosts] = useState([]);

	const [topPosts, setTopPosts] =
		useState([]);

	const [loading, setLoading] =
		useState(true);

	const [loadingMore, setLoadingMore] =
		useState(false);

	const [hasMore, setHasMore] =
		useState(true);

	const [freshCursor, setFreshCursor] =
		useState(null);

	const [userPosts, setUserPosts] =
		useState([]);

	const [loadedUserId, setLoadedUserId] =
		useState(null);

	/* ============================================================
	 * TOP POSTS
	 * ============================================================ */

	const refreshTopPosts = useCallback(
		async () => {
			const {
				data,
				error,
			} = await fetchTopPosts();

			if (error) {
				return {
					data: [],
					error,
				};
			}

			const safeTopPosts =
				data || [];

			setTopPosts(safeTopPosts);

			return {
				data: safeTopPosts,
				error: null,
			};
		},
		[]
	);

	/* ============================================================
	 * INITIAL FEED
	 * ============================================================ */

	useEffect(() => {
		let cancelled = false;

		const loadInitialData =
			async () => {
				setLoading(true);

				setPosts([]);
				setTopPosts([]);
				setFreshCursor(null);
				setHasMore(true);

				const {
					topPosts,
					posts: freshPosts,
					hasMore:
						initialHasMore,
					freshCursor:
						initialCursor,
					error,
				} =
					await fetchInitialFeed();

				if (cancelled) {
					return;
				}

				setTopPosts(topPosts);

				if (error) {
					setPosts([]);
					setHasMore(false);
					setFreshCursor(null);
				} else {
					setPosts(freshPosts);
					setHasMore(
						initialHasMore
					);
					setFreshCursor(
						initialCursor
					);
				}

				setLoading(false);
			};

		loadInitialData();

		return () => {
			cancelled = true;
		};
	}, []);

	/* ============================================================
	 * PAGINATION
	 * ============================================================ */

	const loadMorePosts =
		useCallback(async () => {
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
				} =
					await fetchMoreFreshPosts(
						freshCursor.created_at,
						freshCursor.id
					);

				if (error) {
					return {
						data: [],
						error,
					};
				}

				const freshData =
					data || [];

				if (
					freshData.length === 0
				) {
					setHasMore(false);

					return {
						data: [],
						error: null,
					};
				}

				setPosts((currentPosts) =>
					mergeUniquePosts(
						currentPosts,
						freshData
					)
				);

				setFreshCursor(
					getPostCursor(
						freshData
					)
				);

				setHasMore(
					freshData.length ===
					POSTS_PER_PAGE
				);

				return {
					data: freshData,
					error: null,
				};
			} catch (error) {
				return {
					data: [],
					error,
				};
			} finally {
				setLoadingMore(false);
			}
		}, [
			loadingMore,
			hasMore,
			freshCursor,
		]);

	/* ============================================================
	 * USER POSTS
	 * ============================================================ */

	useEffect(() => {
		if (authLoading || !user) {
			return;
		}

		let cancelled = false;

		const loadUserPosts = async () => {
			const {
				data,
				error,
			} =
				await fetchUserPostData(
					user.id
				);

			if (cancelled) {
				return;
			}

			if (error) {
				setUserPosts([]);
			} else {
				setUserPosts(data || []);
			}

			setLoadedUserId(user.id);
		};

		loadUserPosts();

		return () => {
			cancelled = true;
		};
	}, [user, authLoading]);

	const isUserPostsLoading =
		authLoading ||
		Boolean(
			user &&
			loadedUserId !== user.id
		);

	/* ============================================================
	 * CREATE POST
	 * ============================================================ */

	const addPost = useCallback(
		async (post) => {
			if (!user) {
				return {
					data: null,
					error: new Error(
						"You must be logged in to create a post"
					),
				};
			}

			const {
				data,
				error,
			} =
				await createPostMutation({
					post,
					userId: user.id,
				});

			if (error) {
				return {
					data: null,
					error,
				};
			}

			setPosts((currentPosts) =>
				prependUniquePost(
					currentPosts,
					data
				)
			);

			setUserPosts(
				(currentPosts) =>
					prependUniquePost(
						currentPosts,
						data
					)
			);

			await refreshTopPosts();

			return {
				data,
				error: null,
			};
		},
		[user, refreshTopPosts]
	);

	/* ============================================================
	 * UPDATE POST
	 * ============================================================ */

	const updatePost = useCallback(
		async (id, updates) => {
			if (!user) {
				return {
					data: null,
					error: new Error(
						"You must be logged in to update a post"
					),
				};
			}

			const {
				data,
				error,
			} =
				await updatePostMutation({
					id,
					updates,
					userId: user.id,
				});

			if (error) {
				return {
					data: null,
					error,
				};
			}

			setPosts((currentPosts) =>
				replacePost(
					currentPosts,
					data
				)
			);

			setUserPosts(
				(currentPosts) =>
					replacePost(
						currentPosts,
						data
					)
			);

			await refreshTopPosts();

			return {
				data,
				error: null,
			};
		},
		[user, refreshTopPosts]
	);

	/* ============================================================
	 * DELETE POST
	 * ============================================================ */

	const deletePost = useCallback(
		async (id) => {
			if (!user) {
				return {
					error: new Error(
						"You must be logged in to delete a post"
					),
				};
			}

			const { error } =
				await deletePostMutation({
					id,
					userId: user.id,
				});

			if (error) {
				return {
					error,
				};
			}

			setPosts((currentPosts) =>
				removePost(
					currentPosts,
					id
				)
			);

			setUserPosts(
				(currentPosts) =>
					removePost(
						currentPosts,
						id
					)
			);

			setTopPosts(
				(currentTopPosts) =>
					removePost(
						currentTopPosts,
						id
					)
			);

			await refreshTopPosts();

			return {
				error: null,
			};
		},
		[user, refreshTopPosts]
	);

	/* ============================================================
	 * LOCAL VOTE UPDATES
	 * ============================================================ */

	const applyVoteDelta = useCallback(
		(postId, delta) => {
			if (!postId || !delta) {
				return;
			}

			setPosts((posts) =>
				updatePostVotes(
					posts,
					postId,
					delta
				)
			);

			setTopPosts((posts) =>
				updatePostVotes(
					posts,
					postId,
					delta
				)
			);

			setUserPosts((posts) =>
				updatePostVotes(
					posts,
					postId,
					delta
				)
			);
		},
		[]
	);

	/* ============================================================
	 * RETURN
	 * ============================================================ */

	return {
		posts,
		topPosts,

		loading,
		loadingMore,
		hasMore,

		freshCursor,

		userPosts,
		userPostsLoading:
			isUserPostsLoading,

		setPosts,
		setTopPosts,
		setUserPosts,

		loadMorePosts,
		refreshTopPosts,

		addPost,
		updatePost,
		deletePost,

		applyVoteDelta,
	};
};
