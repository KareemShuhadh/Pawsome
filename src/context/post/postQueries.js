import { supabase } from "@/lib/supabase";

export const POSTS_PER_PAGE = 2;

/* Fetch the global Top Dogs. */

export const fetchTopPosts = async () => {
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

/* Fetch the first Fresh Pups page. */

export const fetchInitialFreshPosts = async () => {
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

/* Fetch older Fresh Pups using the cursor. */

export const fetchMoreFreshPosts = async (
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

/* Fetch posts created by a user. */

export const fetchUserPosts = async (userId) => {
	return supabase
		.from("posts")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", {
			ascending: false,
		});
};

/* Insert a new post. */

export const insertPost = async (postData) => {
	return supabase
		.from("posts")
		.insert(postData)
		.select()
		.single();
};

/* Update a user's post. */

export const updatePostById = async (
	id,
	userId,
	postData
) => {
	return supabase
		.from("posts")
		.update(postData)
		.eq("id", id)
		.eq("user_id", userId)
		.select()
		.single();
};

/* Fetch a post's Cloudinary image ID. */

export const fetchPostImage = async (
	id,
	userId
) => {
	return supabase
		.from("posts")
		.select("image_public_id")
		.eq("id", id)
		.eq("user_id", userId)
		.single();
};

/* Delete a user's post. */

export const deletePostById = async (
	id,
	userId
) => {
	return supabase
		.from("posts")
		.delete()
		.eq("id", id)
		.eq("user_id", userId);
};
