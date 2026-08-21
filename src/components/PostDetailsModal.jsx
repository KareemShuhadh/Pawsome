import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoteButton } from "@/components/VoteButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useVotes } from "@/context/VoteContext";
import { usePosts } from "@/context/PostContext";

export const PostDetailsModal = ({
	post,
	open,
	onClose,
	isMyPost = false,
	onEdit,
	onDelete,
}) => {
	if (!open || !post) {
		return null;
	}

	return (
		<PostDetailsContent
			key={post.id}
			post={post}
			onClose={onClose}
			isMyPost={isMyPost}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	);
};

const PostDetailsContent = ({
	post,
	onClose,
	isMyPost,
	onEdit,
	onDelete,
}) => {
	const { hasVoted, toggleVote, votingPostId } =
		useVotes();

	const { applyVoteDelta } = usePosts();

	const [pulsing, setPulsing] = useState(false);

	const [deleting, setDeleting] = useState(false);

	/*
	 * Because this component is keyed by post.id,
	 * this state starts fresh whenever a different
	 * post is opened.
	 */
	const [voteCount, setVoteCount] = useState(
		post.votes ?? 0
	);

	const voted = hasVoted(post.id);

	const busy = votingPostId === post.id;

	/*
	 * Handle voting inside the modal.
	 */
	const onVote = async () => {
		if (busy) return;

		setPulsing(true);

		setTimeout(() => {
			setPulsing(false);
		}, 400);

		const { error, action } =
			await toggleVote(post.id);

		if (error) {
			console.error("Vote failed:", error);
			return;
		}

		/*
		 * Update the global post state.
		 */
		if (action === "added") {
			applyVoteDelta(post.id, 1);

			setVoteCount((current) => current + 1);
		}

		if (action === "removed") {
			applyVoteDelta(post.id, -1);

			setVoteCount((current) =>
				Math.max(0, current - 1)
			);
		}
	};

	/*
	 * Handle deleting the post from the modal.
	 */
	const handleDelete = async () => {
		if (!onDelete || deleting) return;

		setDeleting(true);

		try {
			const { error } =
				await onDelete(post.id);

			if (error) {
				throw error;
			}

			/*
			 * Close the modal after successful deletion.
			 */
			onClose();
		} catch (error) {
			console.error(
				"Delete failed:",
				error
			);

			alert(
				error?.message ||
					"Couldn't delete the post. Please try again."
			);

			setDeleting(false);
		}
	};

	/*
	 * Prevent the page behind the modal from scrolling.
	 */
	useEffect(() => {
		const originalOverflow =
			document.body.style.overflow;

		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow =
				originalOverflow;
		};
	}, []);

	/*
	 * Close the modal when Escape is pressed.
	 */
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener(
			"keydown",
			handleKeyDown
		);

		return () => {
			document.removeEventListener(
				"keydown",
				handleKeyDown
			);
		};
	}, [onClose]);

	/*
	 * Prevent clicks inside the modal
	 * from closing it.
	 */
	const handleCardClick = (event) => {
		event.stopPropagation();
	};

	return (
		<div
			className={cn(
				"fixed inset-0 z-50",
				"flex items-center justify-center",
				"p-4 sm:p-6",
				"bg-foreground/40",
				"backdrop-blur-sm",
				"animate-in fade-in duration-300"
			)}
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label={`Details for ${post.dog_name}`}
		>
			<Card
				onClick={handleCardClick}
				className={cn(
					"relative w-full max-w-2xl",
					"max-h-[90vh]",
					"overflow-hidden",
					"border-2 border-border/60",
					"shadow-card",
					"bg-card",
					"p-0",
					"gap-0",
					"animate-in zoom-in-95 slide-in-from-bottom-4",
					"duration-300"
				)}
			>
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close post details"
					className="
						absolute
						top-3
						right-3
						z-20
						flex
						items-center
						justify-center
						w-10
						h-10
						rounded-full
						bg-card/90
						backdrop-blur
						border
						border-border
						text-muted-foreground
						shadow-soft
						hover:bg-secondary
						hover:text-foreground
						transition-smooth
					"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Scrollable modal */}
				<div
					className="
						max-h-[90vh]
						overflow-y-auto
						post-details-scrollbar
					"
				>
					{/* Image */}
					<div className="w-full bg-muted flex justify-center">
						<img
							src={post.image_url}
							alt={`${post.dog_name}, a dog from ${post.location}`}
							className="
								block
								max-w-full
								max-h-[65vh]
								w-auto
								h-auto
								object-contain
							"
						/>
					</div>

					{/* Post information */}
					<div className="p-6 sm:p-7">
						<div className="flex items-start justify-between gap-4 mb-3 pr-10">
							<h2 className="text-3xl sm:text-4xl font-bold leading-tight">
								{post.dog_name}
							</h2>

							{/* Vote button */}
							<div
								className="shrink-0"
								onClick={(event) => {
									event.stopPropagation();
								}}
							>
								<VoteButton
									voted={voted}
									voteCount={voteCount}
									busy={busy}
									pulsing={pulsing}
									onClick={onVote}
									dogName={
										post.dog_name
									}
								/>
							</div>
						</div>

						{/* Owner */}
						<p className="text-base text-muted-foreground mb-3">
							with{" "}
							<span className="font-semibold text-foreground">
								{post.owner_name ||
									"Unknown"}
							</span>
						</p>

						{/* Location */}
						<p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-5">
							<MapPin className="w-4 h-4 shrink-0" />
							<span>{post.location}</span>
						</p>

						{/* Description */}
						{post.description && (
							<div className="border-t border-border pt-5">
								<p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
									{post.description}
								</p>
							</div>
						)}

						{/* My Post controls */}
						{isMyPost && (
							<div
								className="
									mt-6
									pt-5
									border-t
									border-border
									flex
									flex-col
									sm:flex-row
									justify-end
									gap-2
								"
								onClick={(event) => {
									event.stopPropagation();
								}}
							>
								{/* Edit */}
								<button
									type="button"
									onClick={() => {
										if (onEdit) {
											onEdit(post);
										}
									}}
									disabled={deleting}
									className="
										px-4
										py-2
										rounded-lg
										bg-card
										border
										border-border
										text-sm
										font-bold
										hover:bg-secondary
										transition-smooth
										shadow-soft
										disabled:opacity-50
										disabled:cursor-not-allowed
									"
								>
									✏️ Edit
								</button>

								{/* Delete */}
								<button
									type="button"
									onClick={handleDelete}
									disabled={deleting}
									className="
										px-4
										py-2
										rounded-lg
										bg-card
										border
										border-destructive/30
										text-destructive
										text-sm
										font-bold
										hover:bg-destructive/10
										transition-smooth
										shadow-soft
										disabled:opacity-60
										disabled:cursor-not-allowed
										inline-flex
										items-center
										gap-1.5
										justify-center
									"
								>
									{deleting ? (
										<>
											<LoadingSpinner
												size="sm"
											/>
											Deleting...
										</>
									) : (
										<>🗑️ Delete</>
									)}
								</button>
							</div>
						)}
					</div>
				</div>
			</Card>
		</div>
	);
};