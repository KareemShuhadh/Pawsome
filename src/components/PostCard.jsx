import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoteButton } from "@/components/VoteButton";
import { useVotes } from "@/context/VoteContext";

export const PostCard = ({
	post,
	featured,
	rank,
	onClick,
	extraContent,
}) => {
	const {
		hasVoted,
		toggleVote,
		votingPostId,
	} = useVotes();

	const [pulsing, setPulsing] = useState(false);

	const voted = hasVoted(post.id);
	const busy = votingPostId === post.id;

	const onVote = async () => {
		if (busy) return;

		setPulsing(true);

		setTimeout(() => {
			setPulsing(false);
		}, 400);

		const { error } = await toggleVote(post.id);

		if (error) {
			console.error("Vote failed:", error);
		}
	};

	const handleCardClick = () => {
		if (onClick) {
			onClick(post);
		}
	};

	const descriptionPreview =
		post.description &&
		post.description.length > 68
			? `${post.description.slice(0, 68).trim()}...`
			: post.description;

	return (
		<Card
			onClick={handleCardClick}
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			onKeyDown={(e) => {
				if (!onClick) return;

				if (
					e.key === "Enter" ||
					e.key === " "
				) {
					e.preventDefault();
					onClick(post);
				}
			}}
			className={cn(
				"group overflow-hidden border-2 border-border/60 shadow-soft hover:shadow-card transition-bounce hover:-translate-y-1 animate-float-up p-0 gap-0",
				onClick && "cursor-pointer",
				featured &&
					"border-primary/40 shadow-glow"
			)}
		>
			<figure className="relative aspect-square overflow-hidden bg-muted">
				{rank && (
					<span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-warm text-primary-foreground font-bold shadow-glow text-sm">
						{rank === 1
							? "🥇"
							: rank === 2
								? "🥈"
								: rank === 3
									? "🥉"
									: `#${rank}`}{" "}
						Top Dog
					</span>
				)}

				<img
					src={post.image_url}
					alt={`${post.dog_name}, a dog from ${post.location}`}
					loading="lazy"
					className="w-full h-full object-cover transition-smooth group-hover:scale-105"
				/>
			</figure>

			<article className="p-5">
				<header className="flex items-start justify-between gap-3 mb-2">
					<h3 className="text-2xl font-bold leading-tight">
						{post.dog_name}
					</h3>

					<span
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<VoteButton
							voted={voted}
							voteCount={post.votes ?? 0}
							busy={busy}
							pulsing={pulsing}
							onClick={onVote}
							dogName={post.dog_name}
						/>
					</span>
				</header>

				<p className="text-sm text-muted-foreground mb-2">
					with{" "}
					<span className="font-semibold text-foreground">
						{post.owner_name}
					</span>
				</p>

				<p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
					<MapPin className="w-3.5 h-3.5" />
					{post.location}
				</p>

				{post.description && (
					<p className="text-sm text-foreground/80 leading-relaxed">
						{descriptionPreview}
					</p>
				)}

				{onClick && post.description && (
					<p className="text-xs text-primary font-semibold mt-2">
						Click to see full post →
					</p>
				)}

				{extraContent && (
					<footer
						className="mt-4 pt-4 border-t border-border flex justify-end gap-2"
						onClick={(event) => {
							event.stopPropagation();
						}}
					>
						{extraContent}
					</footer>
				)}
			</article>
		</Card>
	);
};