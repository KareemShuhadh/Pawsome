import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import {
	fetchUserVotesForPosts,
	addVote,
	removeVote,
} from "../services/voteService";

import { supabase } from "@/lib/supabase";

const EMPTY_SET = new Set();

export const useVoteStatus = ({
	user,
	authLoading,
	posts,
	topPosts,
	applyVoteDelta,
}) => {
	/* Track voted post IDs for the current user. */

	const [voteState, setVoteState] =
		useState(() => ({
			userId: null,
			postIds: new Set(),
		}));

	/* Track post IDs whose vote status has been fetched. */

	const checkedPostIdsRef =
		useRef(new Set());

	const checkedUserIdRef =
		useRef(null);

	/* User whose vote status is loading. */

	const [loadingUserId, setLoadingUserId] =
		useState(null);

	/* Track the post currently being voted on. */

	const [votingState, setVotingState] =
		useState(() => ({
			userId: null,
			postId: null,
		}));

	/* Reuse a stable empty Set when no user vote state exists. */

	const votedPostIds =
		voteState.userId === user?.id
			? voteState.postIds
			: EMPTY_SET;

	/* Include auth and vote-status loading. */

	const loading =
		authLoading ||
		Boolean(
			user &&
				loadingUserId === user.id
		);

	/* Expose the current user's active vote. */

	const votingPostId =
		votingState.userId === user?.id
			? votingState.postId
			: null;

	/* Fetch vote status for newly loaded posts. */

	useEffect(() => {
		if (authLoading || !user) {
			return;
		}

		const userId = user.id;

		/* Reset checked IDs when the user changes. */

		if (
			checkedUserIdRef.current !==
			userId
		) {
			checkedUserIdRef.current =
				userId;

			checkedPostIdsRef.current =
				new Set();
		}

		const allLoadedPostIds = [
			...(topPosts || []),
			...(posts || []),
		]
			.map((post) => post.id)
			.filter(Boolean);

		const uniquePostIds = [
			...new Set(allLoadedPostIds),
		];

		const newPostIds =
			uniquePostIds.filter(
				(postId) =>
					!checkedPostIdsRef.current.has(
						postId
					)
			);

		if (newPostIds.length === 0) {
			return;
		}

		let cancelled = false;

		const loadVotesForPosts =
			async () => {
				setLoadingUserId(userId);

				const {
					data,
					error,
				} =
					await fetchUserVotesForPosts(
						userId,
						newPostIds
					);

				if (cancelled) {
					return;
				}

				if (error) {
					console.error(
						"Error loading vote status:",
						error
					);

					setLoadingUserId(
						(currentUserId) =>
							currentUserId ===
							userId
								? null
								: currentUserId
					);

					return;
				}

				/* Merge fetched votes into local state. */

				setVoteState((current) => {
					const existingIds =
						current.userId ===
						userId
							? current.postIds
							: EMPTY_SET;

					const next =
						new Set(
							existingIds
						);

					(data || []).forEach(
						(row) => {
							if (
								row?.post_id
							) {
								next.add(
									row.post_id
								);
							}
						}
					);

					return {
						userId,
						postIds: next,
					};
				});

				/* Mark these posts as checked. */

				newPostIds.forEach(
					(postId) => {
						checkedPostIdsRef.current.add(
							postId
						);
					}
				);

				/* Clear the loading state. */

				setLoadingUserId(
					(currentUserId) =>
						currentUserId ===
						userId
							? null
							: currentUserId
				);
			};

		loadVotesForPosts();

		return () => {
			cancelled = true;
		};
	}, [
		posts,
		topPosts,
		user,
		authLoading,
	]);

	/* Keep this user's vote state synchronized in realtime. */

	useEffect(() => {
		if (authLoading || !user?.id) {
			return;
		}

		const userId = user.id;

		const channel = supabase
			.channel(`user-votes-${userId}`)

			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "votes",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const postId =
						payload.new?.post_id;

					if (!postId) {
						return;
					}

					setVoteState((current) => {
						const existingIds =
							current.userId === userId
								? current.postIds
								: EMPTY_SET;

						const next =
							new Set(existingIds);

						next.add(postId);

						checkedPostIdsRef.current.add(
							postId
						);

						return {
							userId,
							postIds: next,
						};
					});
				}
			)

			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "votes",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const postId =
						payload.old?.post_id;

					if (!postId) {
						return;
					}

					setVoteState((current) => {
						if (
							current.userId !==
							userId
						) {
							return current;
						}

						const next =
							new Set(
								current.postIds
							);

						next.delete(postId);

						return {
							userId,
							postIds: next,
						};
					});
				}
			)

			.subscribe(() => {});

		return () => {
			supabase.removeChannel(
				channel
			);
		};
	}, [
		user?.id,
		authLoading,
	]);

	/* Check whether the user voted for a post. */

	const hasVoted = useCallback(
		(postId) => {
			return votedPostIds.has(postId);
		},
		[votedPostIds]
	);

	/* Add or remove a vote with optimistic updates. */

	const toggleVote = useCallback(
		async (postId) => {
			/* Voting requires an authenticated user. */

			if (!user) {
				return {
					error: new Error(
						"You must be logged in to vote"
					),
					action: null,
					requiresLogin: true,
				};
			}

			const userId = user.id;

			/* Prevent a second vote while one is in progress. */

			if (
				votingPostId ===
				postId
			) {
				return {
					error: new Error(
						"Vote already in progress for this post"
					),
					action: null,
					requiresLogin: false,
				};
			}

			setVotingState({
				userId,
				postId,
			});

			const alreadyVoted =
				votedPostIds.has(postId);

			/* Remove an existing vote. */

			if (alreadyVoted) {
				/* Update the user's vote state immediately. */

				setVoteState(
					(current) => {
						const existingIds =
							current.userId ===
							userId
								? current.postIds
								: EMPTY_SET;

						const next =
							new Set(
								existingIds
							);

						next.delete(
							postId
						);

						return {
							userId,
							postIds:
								next,
						};
					}
				);

				/* Update the post count immediately. */

				applyVoteDelta(
					postId,
					-1
				);

				try {
					const {
						error,
					} =
						await removeVote(
							userId,
							postId
						);

					if (error) {
						console.error(
							"Error removing vote:",
							error
						);

						/* Restore the user's vote state on failure. */

						setVoteState(
							(current) => {
								const existingIds =
									current.userId ===
									userId
										? current.postIds
										: EMPTY_SET;

								const next =
									new Set(
										existingIds
									);

								next.add(
									postId
								);

								return {
									userId,
									postIds:
										next,
								};
							}
						);

						/* Restore the post count on failure. */

						applyVoteDelta(
							postId,
							1
						);

						return {
							error,
							action: null,
							requiresLogin: false,
						};
					}

					return {
						error: null,
						action: "removed",
						requiresLogin: false,
					};
				} finally {
					setVotingState(
						(current) => {
							if (
								current.userId !==
								userId
							) {
								return current;
							}

							return {
								userId,
								postId:
									null,
							};
						}
					);
				}
			}

			/* Add a new vote. */

			/* Update the user's vote state immediately. */

			setVoteState(
				(current) => {
					const existingIds =
						current.userId ===
						userId
							? current.postIds
							: EMPTY_SET;

					const next =
						new Set(
							existingIds
						);

					next.add(
						postId
					);

					checkedPostIdsRef.current.add(
						postId
					);

					return {
						userId,
						postIds: next,
					};
				}
			);

			/* Update the post count immediately. */

			applyVoteDelta(
				postId,
				1
			);

			try {
				const {
					error,
				} = await addVote(
					userId,
					postId
				);

				if (error) {
					console.error(
						"Error adding vote:",
						error
					);

					/* Restore the user's vote state on failure. */

					setVoteState(
						(current) => {
							const existingIds =
								current.userId ===
								userId
									? current.postIds
									: EMPTY_SET;

							const next =
								new Set(
									existingIds
								);

							next.delete(
								postId
							);

							return {
								userId,
								postIds:
									next,
							};
						}
					);

					/* Restore the post count on failure. */

					applyVoteDelta(
						postId,
						-1
					);

					return {
						error,
						action: null,
						requiresLogin: false,
					};
				}

				return {
					error: null,
					action: "added",
					requiresLogin: false,
				};
			} finally {
				setVotingState(
					(current) => {
						if (
							current.userId !==
							userId
						) {
							return current;
						}

						return {
							userId,
							postId:
								null,
						};
					}
				);
			}
		},
		[
			user,
			votingPostId,
			votedPostIds,
			applyVoteDelta,
		]
	);

	/* Expose vote state and actions to consumers. */

	return {
		votedPostIds,
		hasVoted,
		toggleVote,
		loading,
		votingPostId,
	};
};
