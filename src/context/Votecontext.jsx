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
	const { user, loading: authLoading } = useAuth();

	/*
	 * Get the posts that are currently loaded by
	 * PostContext.
	 *
	 * "posts" = currently loaded Fresh Pups
	 * "topPosts" = the 3 Top Dogs that are always loaded
	 */
	const {
		posts,
		topPosts,
	} = usePosts();

	/*
	 * Stores the IDs of posts the current user
	 * has voted for.
	 *
	 * IMPORTANT:
	 *
	 * This is no longer populated with ALL votes
	 * belonging to the user.
	 *
	 * It only contains votes for posts that we
	 * have actually loaded on the screen.
	 */
	const [votedPostIds, setVotedPostIds] =
		useState(new Set());

	/*
	 * Keeps track of post IDs for which we have
	 * already checked the user's vote status.
	 *
	 * Example:
	 *
	 * First page:
	 * [1,2,3,...,20]
	 *
	 * These IDs are stored here.
	 *
	 * When another 20 posts are loaded, we only
	 * query those new IDs.
	 */
	const checkedPostIdsRef = useRef(new Set());

	/*
	 * Loading state for vote-status queries.
	 */
	const [loading, setLoading] = useState(false);

	/*
	 * Which post is currently being voted on.
	 *
	 * Used to prevent rapid double clicks.
	 */
	const [votingPostId, setVotingPostId] =
		useState(null);

	/*
	 * Login notification state.
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
	 * --------------------------------------------------
	 * RESET VOTE STATE WHEN USER CHANGES
	 * --------------------------------------------------
	 *
	 * When:
	 *
	 * user A logs out
	 * user B logs in
	 *
	 * we MUST forget which post IDs we already
	 * checked for user A.
	 *
	 * Otherwise user B could incorrectly inherit
	 * user A's vote information.
	 */
	useEffect(() => {
		checkedPostIdsRef.current = new Set();

		setVotedPostIds(new Set());
		setLoading(false);
	}, [user?.id]);

	/*
	 * --------------------------------------------------
	 * LOAD VOTE STATUS FOR CURRENTLY LOADED POSTS
	 * --------------------------------------------------
	 *
	 * This is the main performance improvement.
	 *
	 * We DO NOT:
	 *
	 * .select("post_id")
	 * .eq("user_id", user.id)
	 *
	 * because that would download every vote the
	 * user has ever made.
	 *
	 * Instead we only ask about post IDs that are
	 * currently loaded on the page.
	 */
	useEffect(() => {
		if (authLoading) return;

		/*
		 * Logged out:
		 *
		 * There is nothing to check.
		 */
		if (!user) {
			setVotedPostIds(new Set());
			setLoading(false);

			return;
		}

		/*
		 * Combine:
		 *
		 * 1. Top 3
		 * 2. Current Fresh Pups
		 *
		 * A Set removes duplicates automatically.
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
		 * Find only post IDs that we have NOT
		 * checked yet.
		 *
		 * This is important for pagination.
		 */
		const newPostIds =
			uniquePostIds.filter(
				(postId) =>
					!checkedPostIdsRef.current.has(
						postId
					)
			);

		/*
		 * Nothing new to check.
		 */
		if (newPostIds.length === 0) {
			return;
		}

		let cancelled = false;

		const loadVotesForPosts = async () => {
			setLoading(true);

			/*
			 * Query only votes belonging to:
			 *
			 * current user
			 *
			 * AND
			 *
			 * the newly loaded posts.
			 */
			const { data, error } = await supabase
				.from("votes")
				.select("post_id")
				.eq("user_id", user.id)
				.in("post_id", newPostIds);

			if (cancelled) return;

			if (error) {
				console.error(
					"Error loading vote status:",
					error
				);

				/*
				 * We do NOT mark the posts as checked
				 * when the request fails.
				 *
				 * This allows the next effect run to
				 * try again.
				 */
				setLoading(false);

				return;
			}

			/*
			 * Add the newly discovered votes to the
			 * existing Set.
			 */
			setVotedPostIds((current) => {
				const next = new Set(current);

				(data || []).forEach((row) => {
					next.add(row.post_id);
				});

				return next;
			});

			/*
			 * Mark these post IDs as checked only
			 * after the request succeeds.
			 */
			newPostIds.forEach((postId) => {
				checkedPostIdsRef.current.add(
					postId
				);
			});

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
	 * --------------------------------------------------
	 * LOGIN PROMPT CLEANUP
	 * --------------------------------------------------
	 */
	useEffect(() => {
		return () => {
			if (loginPromptTimeoutRef.current) {
				clearTimeout(
					loginPromptTimeoutRef.current
				);
			}

			if (removePromptTimeoutRef.current) {
				clearTimeout(
					removePromptTimeoutRef.current
				);
			}
		};
	}, []);

	/*
	 * Completely remove the login notification.
	 */
	const removeLoginPrompt = () => {
		setShowLoginPrompt(false);
		setPromptAnimation("enter");

		removePromptTimeoutRef.current = null;
	};

	/*
	 * Start the exit animation.
	 */
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

	/*
	 * Show login notification.
	 */
	const triggerLoginPrompt = () => {
		if (loginPromptTimeoutRef.current) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current = null;
		}

		if (removePromptTimeoutRef.current) {
			clearTimeout(
				removePromptTimeoutRef.current
			);

			removePromptTimeoutRef.current = null;
		}

		setShowLoginPrompt(true);
		setPromptAnimation("enter");

		loginPromptTimeoutRef.current =
			setTimeout(() => {
				startExitAnimation();
			}, 3500);
	};

	/*
	 * Manually dismiss login notification.
	 */
	const dismissLoginPrompt = () => {
		if (loginPromptTimeoutRef.current) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current = null;
		}

		startExitAnimation();
	};

	/*
	 * --------------------------------------------------
	 * CHECK IF USER VOTED
	 * --------------------------------------------------
	 */
	const hasVoted = (postId) => {
		return votedPostIds.has(postId);
	};

	/*
	 * --------------------------------------------------
	 * TOGGLE VOTE
	 * --------------------------------------------------
	 */
	const toggleVote = async (postId) => {
		/*
		 * Logged-out users cannot vote.
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
		 * Prevent rapid double-clicks on the
		 * same post.
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

		const alreadyVoted =
			votedPostIds.has(postId);

		try {
			/*
			 * ------------------------------------------------
			 * REMOVE VOTE
			 * ------------------------------------------------
			 */
			if (alreadyVoted) {
				const { error } =
					await supabase
						.from("votes")
						.delete()
						.eq("post_id", postId)
						.eq("user_id", user.id);

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
				 * Remove from local Set immediately.
				 */
				setVotedPostIds((current) => {
					const next = new Set(
						current
					);

					next.delete(postId);

					return next;
				});

				return {
					error: null,
					action: "removed",
				};
			}

			/*
			 * ------------------------------------------------
			 * ADD VOTE
			 * ------------------------------------------------
			 */
			const { error } =
				await supabase
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
			 * Add to local Set immediately.
			 */
			setVotedPostIds((current) => {
				const next = new Set(current);

				next.add(postId);

				/*
				 * This post has now definitely been
				 * checked because we just voted for it.
				 */
				checkedPostIdsRef.current.add(
					postId
				);

				return next;
			});

			return {
				error: null,
				action: "added",
			};
		} finally {
			setVotingPostId(null);
		}
	};

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
				================================
				LOGIN NOTIFICATION
				================================
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
							{/* Icon */}

							<div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center shrink-0">
								<Heart className="w-4 h-4 text-primary-foreground" />
							</div>

							{/* Message */}

							<p className="text-sm font-semibold text-foreground whitespace-nowrap">
								Log in to vote for your favorite pups!
							</p>

							{/* Login button */}

							<Link
								to="/login"
								onClick={
									dismissLoginPrompt
								}
								className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:-translate-y-0.5 transition-bounce shrink-0"
							>
								Log in
							</Link>

							{/* Close button */}

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
