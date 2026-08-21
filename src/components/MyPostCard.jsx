import { useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PostCard } from "@/components/PostCard";

export const MyPostCard = ({
	post,
	onEdit,
	onDelete,
	onOpen,
}) => {
	const [deleting, setDeleting] = useState(false);

	const handleDelete = async () => {
		if (deleting) return;

		setDeleting(true);

		try {
			const { error } = await onDelete(post.id);

			if (error) {
				throw error;
			}
		} catch (error) {
			console.error("Delete failed:", error);

			alert(
				error?.message ||
					"Couldn't delete the post. Please try again."
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<PostCard
			post={post}
			onClick={onOpen}
			disableHover
			extraContent={
				<>
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onEdit(post);
						}}
						disabled={deleting}
						className="
							px-3
							py-1.5
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

					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							handleDelete();
						}}
						disabled={deleting}
						className="
							px-3
							py-1.5
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
							min-w-[90px]
							justify-center
						"
					>
						{deleting ? (
							<>
								<LoadingSpinner size="sm" />
								Deleting...
							</>
						) : (
							<>🗑️ Delete</>
						)}
					</button>
				</>
			}
		/>
	);
};