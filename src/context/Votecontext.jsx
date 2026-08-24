import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";

import { useVoteStatus } from "@/hooks/useVoteStatus";


const VoteContext = createContext(null);

export const VoteProvider = ({
	children,
}) => {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	/*
	 * ======================================================
	 * POSTS
	 * ======================================================
	 */

const {
    posts,
    topPosts,
    applyVoteDelta,
} = usePosts();

	/*
	 * ======================================================
	 * VOTE STATUS
	 * ======================================================
	 */

const {
    hasVoted,
    toggleVote,
    loading,
    votingPostId,
} = useVoteStatus({
    user,
    authLoading,
    posts,
    topPosts,
    applyVoteDelta,
});


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
	 * REMOVE LOGIN PROMPT
	 * ======================================================
	 */

	const removeLoginPrompt = () => {
		setShowLoginPrompt(false);
		setPromptAnimation("enter");

		removePromptTimeoutRef.current =
			null;
	};

	/*
	 * ======================================================
	 * START EXIT ANIMATION
	 * ======================================================
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
	 * ======================================================
	 * TRIGGER LOGIN PROMPT
	 * ======================================================
	 */

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

	/*
	 * ======================================================
	 * TOGGLE VOTE
	 * ======================================================
	 *
	 * The hook handles the actual vote.
	 *
	 * The Context handles the login prompt.
	 */

	const handleToggleVote = async (
		postId
	) => {
		const result =
			await toggleVote(postId);

		if (
			result?.requiresLogin
		) {
			triggerLoginPrompt();
		}

		return result;
	};

	/*
	 * ======================================================
	 * DISMISS LOGIN PROMPT
	 * ======================================================
	 */

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
	 * PROVIDER
	 * ======================================================
	 */

	return (
		<VoteContext.Provider
			value={{
				hasVoted,

				toggleVote:
					handleToggleVote,

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
