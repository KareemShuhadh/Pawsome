/* Get the cursor from the last post. */

export const getPostCursor = (posts) => {
	if (!posts || posts.length === 0) {
		return null;
	}

	const lastPost =
		posts[posts.length - 1];

	return {
		created_at: lastPost.created_at,
		id: lastPost.id,
	};
};

/* Append posts that are not already loaded. */

export const mergeUniquePosts = (
	currentPosts,
	newPosts
) => {
	const existingIds = new Set(
		currentPosts.map((post) => post.id)
	);

	const uniqueNewPosts = newPosts.filter(
		(post) => !existingIds.has(post.id)
	);

	return [
		...currentPosts,
		...uniqueNewPosts,
	];
};

/* Add a post only if it is not already present. */

export const prependUniquePost = (
	currentPosts,
	newPost
) => {
	const alreadyExists =
		currentPosts.some(
			(post) => post.id === newPost.id
		);

	if (alreadyExists) {
		return currentPosts;
	}

	return [newPost, ...currentPosts];
};

/* Replace a matching post in an array. */

export const replacePost = (
	currentPosts,
	updatedPost
) => {
	return currentPosts.map((post) =>
		post.id === updatedPost.id
			? updatedPost
			: post
	);
};

/* Remove a post from an array. */

export const removePost = (
	currentPosts,
	postId
) => {
	return currentPosts.filter(
		(post) => post.id !== postId
	);
};
