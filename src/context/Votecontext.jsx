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

const VoteContext = createContext(null);

export const VoteProvider = ({ children }) => {
	const { user, loading: authLoading } = useAuth();

	const [votedPostIds, setVotedPostIds] = useState(new Set());

	const [loading, setLoading] = useState(true);
	const [votingPostId, setVotingPostId] = useState(null);

	/*
	 * Login notification
	 *
	 * showLoginPrompt:
	 * Controls whether the notification exists in the DOM.
	 *
	 * promptAnimation:
	 *
	 * "enter" -> notification comes up
	 * "visible" -> notification stays still
	 * "exit" -> notification goes down
	 */
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [promptAnimation, setPromptAnimation] = useState("enter");

	const loginPromptTimeoutRef = useRef(null);
	const removePromptTimeoutRef = useRef(null);

	/*
	 * Load votes belonging to the current user.
	 */
	useEffect(() => {
		if (authLoading) return;

		let cancelled = false;

		const loadUserVotes = async () => {
			if (!user) {
				if (!cancelled) {
					setVotedPostIds(new Set());
					setLoading(false);
				}

				return;
			}

			setLoading(true);

			const { data, error } = await supabase
				.from("votes")
				.select("post_id")
				.eq("user_id", user.id);

			if (cancelled) return;

			if (error) {
				console.error(
					"Error loading user votes:",
					error
				);

				setVotedPostIds(new Set());
			} else {
				setVotedPostIds(
					new Set(
						(data || []).map(
							(row) => row.post_id
						)
					)
				);
			}

			setLoading(false);
		};

		loadUserVotes();

		return () => {
			cancelled = true;
		};
	}, [user, authLoading]);

	/*
	 * Clean up all timers when VoteProvider
	 * is removed.
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
	 * Completely remove the notification.
	 *
	 * IMPORTANT:
	 * This only happens AFTER the exit animation
	 * has finished.
	 */
	const removeLoginPrompt = () => {
		setShowLoginPrompt(false);

		/*
		 * Reset animation state so the next time
		 * the notification appears it can play
		 * the entrance animation again.
		 */
		setPromptAnimation("enter");

		removePromptTimeoutRef.current = null;
	};

	/*
	 * Start the exit animation.
	 */
	const startExitAnimation = () => {
		/*
		 * Don't start the exit animation twice.
		 */
		if (promptAnimation === "exit") {
			return;
		}

		/*
		 * Play the downward animation.
		 */
		setPromptAnimation("exit");

		/*
		 * Wait for the CSS animation to finish
		 * before removing the notification from
		 * the DOM.
		 */
		removePromptTimeoutRef.current =
			setTimeout(() => {
				removeLoginPrompt();
			}, 900);
	};

	/*
	 * Show the login notification.
	 */
	const triggerLoginPrompt = () => {
		/*
		 * Clear the old visibility timer.
		 */
		if (loginPromptTimeoutRef.current) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current = null;
		}

		/*
		 * Clear any pending removal.
		 */
		if (removePromptTimeoutRef.current) {
			clearTimeout(
				removePromptTimeoutRef.current
			);

			removePromptTimeoutRef.current = null;
		}

		/*
		 * If the notification is currently
		 * disappearing, bring it back smoothly.
		 */
		setShowLoginPrompt(true);

		/*
		 * Always restart the notification timer.
		 */
		setPromptAnimation("enter");

		/*
		 * Keep it visible for 3.5 seconds.
		 */
		loginPromptTimeoutRef.current =
			setTimeout(() => {
				startExitAnimation();
			}, 3500);
	};

	/*
	 * User manually closes the notification.
	 */
	const dismissLoginPrompt = () => {
		/*
		 * Cancel automatic closing.
		 */
		if (loginPromptTimeoutRef.current) {
			clearTimeout(
				loginPromptTimeoutRef.current
			);

			loginPromptTimeoutRef.current = null;
		}

		/*
		 * Play the same smooth downward
		 * animation used for automatic closing.
		 */
		startExitAnimation();
	};

	/*
	 * Check whether the current user voted
	 * for a specific post.
	 */
	const hasVoted = (postId) => {
		return votedPostIds.has(postId);
	};

	/*
	 * Add or remove a vote.
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
		 * Prevent rapid double-clicks.
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
			 * Remove vote.
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
				 * Update local vote state.
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
			 * Add vote.
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
			 * Update local vote state.
			 */
			setVotedPostIds((current) => {
				const next = new Set(
					current
				);

				next.add(postId);

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