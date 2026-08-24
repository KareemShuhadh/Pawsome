import { supabase } from "@/lib/supabase";

/*
 * ======================================================
 * FETCH USER VOTES FOR POSTS
 * ======================================================
 *
 * Returns the vote rows belonging to the current user
 * for the provided post IDs.
 */

export const fetchUserVotesForPosts = async (
	userId,
	postIds
) => {
	if (
		!userId ||
		!postIds ||
		postIds.length === 0
	) {
		return {
			data: [],
			error: null,
		};
	}

	return supabase
		.from("votes")
		.select("post_id")
		.eq("user_id", userId)
		.in("post_id", postIds);
};

/*
 * ======================================================
 * ADD VOTE
 * ======================================================
 */

export const addVote = async (
	userId,
	postId
) => {
	return supabase
		.from("votes")
		.insert({
			post_id: postId,
			user_id: userId,
		});
};

/*
 * ======================================================
 * REMOVE VOTE
 * ======================================================
 */

export const removeVote = async (
	userId,
	postId
) => {
	return supabase
		.from("votes")
		.delete()
		.eq("post_id", postId)
		.eq("user_id", userId);
};
