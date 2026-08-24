import {
	POSTS_PER_PAGE,
	fetchTopPosts,
	fetchInitialFreshPosts,
	fetchMoreFreshPosts,
	fetchUserPosts,
} from "./postQueries";

import {
	getPostCursor,
} from "./postHelpers";

/* Load the initial home feed. */

export const fetchInitialFeed = async () => {
	const {
		data: fetchedTopPosts,
		error: topPostsError,
	} = await fetchTopPosts();

	const topPosts =
		topPostsError
			? []
			: fetchedTopPosts || [];

	const {
		data: fetchedFreshPosts,
		error: freshPostsError,
	} = await fetchInitialFreshPosts();

	if (freshPostsError) {
		return {
			topPosts,
			posts: [],
			hasMore: false,
			freshCursor: null,
			error: freshPostsError,
		};
	}

	const posts =
		fetchedFreshPosts || [];

	if (posts.length < POSTS_PER_PAGE) {
		return {
			topPosts,
			posts,
			hasMore: false,
			freshCursor:
				getPostCursor(posts),
			error: null,
		};
	}

	const lastPost =
		posts[posts.length - 1];

	const {
		data: nextPostCheck,
		error: nextPostError,
	} = await fetchMoreFreshPosts(
		lastPost.created_at,
		lastPost.id
	);

	return {
		topPosts,
		posts,
		hasMore:
			!nextPostError &&
			(nextPostCheck || []).length > 0,
		freshCursor:
			getPostCursor(posts),
		error: null,
	};
};

/* Load posts belonging to a user. */

export const fetchUserPostData = async (
	userId
) => {
	return fetchUserPosts(userId);
};
