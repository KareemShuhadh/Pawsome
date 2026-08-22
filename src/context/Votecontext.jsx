import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";

const VoteContext = createContext(null);

export const VoteProvider = ({ children }) => {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	/*
	 * Get currently loaded posts.
	 */

	const {
		posts,
		topPosts,
	} = usePosts();

	/*
	 * ======================================================
	 * VOTED POST IDS
	 * ======================================================
	 *
	 * Contains only the posts currently loaded/checked.
	 */

	const [votedPostIds, setVotedPostIds] =
		useState(new Set());

	/*
	 * ======================================================
	 * CHECKED POST IDS
	 * ======================================================
	 *
	 * Prevents repeatedly asking Supabase about the
	 * same post.
	 */

	const checkedPostIdsRef = useRef(
		new Set()
	);

	/*
	 * ======================================================
	 * LOADING
	 * ======================================================
	 */

	const [loading, setLoading] =
		useState(false);

	/*
	 * ======================================================
	 * CURRENT VOTE
	 * ======================================================
	 */

	const [votingPostId, setVotingPostId] =
		useState(null);

	/*
	 * ======================================================
	 * LOGIN PROMPT
	 * ======================================================
	 */

	const [showLoginPrompt, setShowLoginPrompt] =
		useState(false);

	const [promptAnimation, setPromptAnimation] =
		useState("enter");

	const loginPromptTimeoutRef =
		useRef(null);

	const removePromptTimeoutRef =
		useRef(null);

	/*
	 * ======================================================
	 * RESET WHEN USER CHANGES
	 * ======================================================
	 */

	useEffect(() => {
		/*
		 * Forget all vote information belonging to
		 * the previous user.
		 */

		checkedPostIdsRef.current =
			new Set();

		setVotedPostIds(new Set());

		setLoading(false);
	}, [user?.id]);

	/*
	 * ======================================================
	 * LOAD VOTE STATUS
	 * ======================================================
	 *
	 * Only query votes for posts currently loaded
	 * on the screen.
	 */

	useEffect(() => {
		if (authLoading) {
			return;
		}

		/*
		 * Logged out.
		 */

		if (!user) {
			setVotedPostIds(new Set());
			setLoading(false);

			return;
		}

		/*
		 * Combine:
		 *
		 * Top Dogs
		 * +
		 * Fresh Pups
		 */

		const allLoadedPostIds = [
			...(topPosts || []),
			...(posts || []),
		]
			.map((post) => post.id)
			.filter(Boolean);

		const uniquePostIds = [
			...new Set(allLoadedPostIds),
		];

		/*
		 * Only check IDs we have not checked before.
		 */

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
				setLoading(true);

				const {
					data,
					error,
				} = await supabase
					.from("votes")
					.select("post_id")
					.eq(
						"user_id",
						user.id
					)
					.in(
						"post_id",
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

					setLoading(false);

					return;
				}

				/*
				 * Add returned votes.
				 */

				setVotedPostIds(
					(current) => {
						const next =
							new Set(
								current
							);

						(data || []).forEach(
							(row) => {
								next.add(
									row.post_id
								);
							}
						);

						return next;
					}
				);

				/*
				 * Mark these posts as checked.
				 */

				newPostIds.forEach(
					(postId) => {
						checkedPostIdsRef.current.add(
							postId
						);
					}
				);

				setLoading(false);
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

	/*
	 * ======================================================
	 * REALTIME USER VOTES
	 * ======================================================
	 *
	 * This listens to the votes table.
	 *
	 * INSERT:
	 *   Current user voted for a post.
	 *
	 * DELETE:
	 *   Current user removed their vote.
	 *
	 * IMPORTANT:
	 *
	 * This does NOT update post.votes.
	 *
	 * PostgreSQL + the trigger + PostContext Realtime
	 * handle the actual vote count.
	 */

	useEffect(() => {
		if (authLoading || !user) {
			return;
		}

		const channel = supabase
			.channel(
				`user-votes-${user.id}`
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "votes",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const postId =
						payload.new
							?.post_id;

					if (!postId) {
						return;
					}

					console.log(
						"Realtime vote INSERT:",
						payload.new
					);

					/*
					 * User has voted for this post.
					 */

					setVotedPostIds(
						(current) => {
							const next =
								new Set(
									current
								);

							next.add(
								postId
							);

							/*
							 * We know this post's
							 * vote state now.
							 */

							checkedPostIdsRef.current.add(
								postId
							);

							return next;
						}
					);
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "votes",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const postId =
						payload.old
							?.post_id;

					if (!postId) {
						return;
					}

					console.log(
						"Realtime vote DELETE:",
						payload.old
					);

					/*
					 * User no longer has a vote
					 * for this post.
					 */

					setVotedPostIds(
						(current) => {
							const next =
								new Set(
									current
								);

							next.delete(
								postId
							);

							return next;
						}
					);
				}
			)
			.subscribe((status) => {
				console.log(
					"User votes realtime status:",
					status
				);
			});

		return () => {
			supabase.removeChannel(
				channel
			);
		};
	}, [
		user?.id,
		authLoading,
	]);

	/*
	 * ======================================================
	 * LOGIN PROMPT CLEANUP
	 * ======================================================
	 */

	useEffect(() => {
		return () => {
			if (
				loginPromptTimeoutRef.current
			) {
				clearTimeout(
					loginPromptTimeoutRef.current
				);
			}

			if (
				removePromptTimeoutRef.current
			) {
				clearTimeout(
					removePromptTimeoutRef.current
				);
			}
		};
	}, []);

	/*
	 * ======================================================
	 * LOGIN PROMPT
	 * ======================================================
	 */

	const removeLoginPrompt = () => {
		setShowLoginPrompt(false);
		setPromptAnimation("enter");

		removePromptTimeoutRef.current =
			null;
	};

	const startExitAnimation = () => {
		if (promptAnimation === "exit") {
			return;
		}

		setPromptAnimation("exit");

		removePromptTimeoutRef.current =
			setTimeout(() => {
				removeLoginPrompt();
			}, 900);
	};

	const triggerLoginPrompt = () => {
		if (
			loginPromptTimeoutRef.current
		) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current =
				null;
		}

		if (
			removePromptTimeoutRef.current
		) {
			clearTimeout(
				removePromptTimeoutRef.current
			);

			removePromptTimeoutRef.current =
				null;
		}

		setShowLoginPrompt(true);
		setPromptAnimation("enter");

		loginPromptTimeoutRef.current =
			setTimeout(() => {
				startExitAnimation();
			}, 3500);
	};

	const dismissLoginPrompt = () => {
		if (
			loginPromptTimeoutRef.current
		) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current =
				null;
		}

		startExitAnimation();
	};

	/*
	 * ======================================================
	 * CHECK IF USER VOTED
	 * ======================================================
	 */

	const hasVoted = (postId) => {
		return votedPostIds.has(postId);
	};

	/*
	 * ======================================================
	 * TOGGLE VOTE
	 * ======================================================
	 *
	 * IMPORTANT:
	 *
	 * We only insert/delete the vote row.
	 *
	 * We do NOT modify posts.votes here.
	 *
	 * The database trigger does that.
	 */

	const toggleVote = async (postId) => {
		/*
		 * ----------------------------------------------
		 * NOT LOGGED IN
		 * ----------------------------------------------
		 */

		if (!user) {
			triggerLoginPrompt();

			return {
				error: new Error(
					"You must be logged in to vote"
				),
				action: null,
			};
		}

		/*
		 * ----------------------------------------------
		 * PREVENT DOUBLE CLICK
		 * ----------------------------------------------
		 */

		if (votingPostId === postId) {
			return {
				error: new Error(
					"Vote already in progress for this post"
				),
				action: null,
			};
		}

		setVotingPostId(postId);

		/*
		 * Read the current local vote state.
		 *
		 * This is only determining whether the user
		 * wants INSERT or DELETE.
		 */

		const alreadyVoted =
			votedPostIds.has(postId);

		try {
			/*
			 * ==========================================
			 * REMOVE VOTE
			 * ==========================================
			 */

			if (alreadyVoted) {
				const {
					error,
				} = await supabase
					.from("votes")
					.delete()
					.eq(
						"post_id",
						postId
					)
					.eq(
						"user_id",
						user.id
					);

				if (error) {
					console.error(
						"Error removing vote:",
						error
					);

					return {
						error,
						action: null,
					};
				}

				/*
				 * Update local user vote state.
				 *
				 * Realtime will also send DELETE,
				 * but deleting an already-deleted Set
				 * item is harmless.
				 */

				setVotedPostIds(
					(current) => {
						const next =
							new Set(
								current
							);

						next.delete(
							postId
						);

						return next;
					}
				);

				/*
				 * DO NOT update the post vote count here.
				 *
				 * The trigger will update posts.votes.
				 */

				return {
					error: null,
					action: "removed",
				};
			}

			/*
			 * ==========================================
			 * ADD VOTE
			 * ==========================================
			 */

			const {
				error,
			} = await supabase
				.from("votes")
				.insert({
					post_id: postId,
					user_id: user.id,
				});

			if (error) {
				console.error(
					"Error adding vote:",
					error
				);

				return {
					error,
					action: null,
				};
			}

			/*
			 * Update local user vote state.
			 *
			 * Realtime will also send INSERT,
			 * but Set.add() is idempotent.
			 */

			setVotedPostIds(
				(current) => {
					const next =
						new Set(
							current
						);

					next.add(
						postId
					);

					checkedPostIdsRef.current.add(
						postId
					);

					return next;
				}
			);

			/*
			 * IMPORTANT:
			 *
			 * We do NOT increment posts.votes here.
			 *
			 * PostgreSQL trigger:
			 *
			 * votes INSERT
			 *       ↓
			 * COUNT(*)
			 *       ↓
			 * posts.votes
			 *       ↓
			 * Realtime
			 */

			return {
				error: null,
				action: "added",
			};
		} finally {
			setVotingPostId(null);
		}
	};

	/*
	 * ======================================================
	 * PROVIDER
	 * ======================================================
	 */

	return (
		<VoteContext.Provider
			value={{
				hasVoted,
				toggleVote,
				loading,
				votingPostId,
			}}
		>
			{children}

			{/*
			 * ================================================
			 * LOGIN NOTIFICATION
			 * ================================================
			 */}

			{showLoginPrompt && (
				<div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
					<div
						className={`
							pointer-events-auto
							${
								promptAnimation ===
								"enter"
									? "animate-login-prompt-enter"
									: promptAnimation ===
										  "exit"
										? "animate-login-prompt-exit"
										: ""
							}
						`}
					>
						<div className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl bg-card border border-border shadow-glow max-w-[calc(100vw-2rem)]">
							<div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center shrink-0">
								<Heart className="w-4 h-4 text-primary-foreground" />
							</div>

							<p className="text-sm font-semibold text-foreground whitespace-nowrap">
								Log in to vote for your favorite pups!
							</p>

							<Link
								to="/login"
								onClick={
									dismissLoginPrompt
								}
								className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:-translate-y-0.5 transition-bounce shrink-0"
							>
								Log in
							</Link>

							<button
								type="button"
								onClick={
									dismissLoginPrompt
								}
								aria-label="Dismiss"
								className="text-muted-foreground hover:text-foreground transition-smooth shrink-0"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			)}
		</VoteContext.Provider>
	);
};

export const useVotes = () => {
	const context = useContext(VoteContext);

	if (!context) {
		throw new Error(
			"useVotes must be used inside VoteProvider"
		);
	}

	return context;
};