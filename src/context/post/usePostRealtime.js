import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

import {
	prependUniquePost,
	replacePost,
	removePost,
} from "./postHelpers";

export const usePostRealtime = ({
	userId,
	setPosts,
	setTopPosts,
	setUserPosts,
	refreshTopPosts,
}) => {
	useEffect(() => {
		const channel = supabase
			.channel("posts-realtime")

			/* New post event. */

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

					/* Add to Fresh Pups. */

					setPosts((currentPosts) =>
						prependUniquePost(
							currentPosts,
							newPost
						)
					);

					/* Add to My Posts when owned by this user. */

					if (
						userId &&
						newPost.user_id ===
							userId
					) {
						setUserPosts(
							(currentPosts) =>
								prependUniquePost(
									currentPosts,
									newPost
								)
						);
					}

					/* Refresh Top Dogs without blocking local updates. */

					refreshTopPosts();
				}
			)

			/* Updated post event. */

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

					/* Update Fresh Pups. */

					setPosts((currentPosts) =>
						replacePost(
							currentPosts,
							updatedPost
						)
					);

					/* Update My Posts. */

					setUserPosts((currentPosts) =>
						replacePost(
							currentPosts,
							updatedPost
						)
					);

					/* Update the local Top Dogs copy immediately. */

					setTopPosts(
						(currentTopPosts) =>
							replacePost(
								currentTopPosts,
								updatedPost
							)
					);

					/* Re-fetch in case Top 3 membership changed. */

					refreshTopPosts();
				}
			)

			/* Deleted post event. */

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

					/* Remove from Fresh Pups. */

					setPosts((currentPosts) =>
						removePost(
							currentPosts,
							deletedPost.id
						)
					);

					/* Remove from My Posts. */

					setUserPosts((currentPosts) =>
						removePost(
							currentPosts,
							deletedPost.id
						)
					);

					/* Remove from Top Dogs immediately. */

					setTopPosts(
						(currentTopPosts) =>
							removePost(
								currentTopPosts,
								deletedPost.id
							)
					);

					/* Re-fetch in case another post enters the Top 3. */

					refreshTopPosts();
				}
			)

			.subscribe();

		return () => {
			supabase.removeChannel(
				channel
			);
		};
	}, [
		userId,
		setPosts,
		setTopPosts,
		setUserPosts,
		refreshTopPosts,
	]);
};
