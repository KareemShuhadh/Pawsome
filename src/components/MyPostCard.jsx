import { useState } from "react";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PostCard } from "@/components/PostCard";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

export const MyPostCard = ({
	post,
	onEdit,
	onDelete,
	onOpen,
	showNotification,
}) => {
	const [deleteConfirmOpen, setDeleteConfirmOpen] =
		useState(false);

	const [deleting, setDeleting] = useState(false);

	/*
	 * ======================================================
	 * OPEN DELETE CONFIRMATION
	 * ======================================================
	 */

	const handleDeleteClick = () => {
		if (deleting) return;

		setDeleteConfirmOpen(true);
	};

	/*
	 * ======================================================
	 * CANCEL DELETE
	 * ======================================================
	 */

	const handleCancelDelete = () => {
		if (deleting) return;

		setDeleteConfirmOpen(false);
	};

	/*
	 * ======================================================
	 * ACTUALLY DELETE POST
	 * ======================================================
	 */

	const handleConfirmDelete = async () => {
		if (deleting) return;

		setDeleting(true);

		try {
			const { error } = await onDelete(post.id);

			if (error) {
				throw error;
			}

			/*
			 * Delete succeeded.
			 *
			 * Close the confirmation first,
			 * then show the notification.
			 */
			setDeleteConfirmOpen(false);

			showNotification(
				"delete-success",
				"Aww... your post is gone. We'll miss it! 🐶💔"
			);
		} catch (error) {
			console.error("Delete failed:", error);

			setDeleteConfirmOpen(false);

			showNotification(
				"error",
				error?.message ||
					"Couldn't delete the post. Please try again."
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<PostCard
				post={post}
				onClick={onOpen}
				disableHover
				extraContent={
					<>
						{/* ================================
						    EDIT
						    ================================ */}

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

						{/* ================================
						    DELETE
						    ================================ */}

						<button
							type="button"
							onClick={(event) => {
								event.stopPropagation();
								handleDeleteClick();
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
								min-w-22.5
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

			{/* ==================================================
			    DELETE CONFIRMATION
			    ================================================== */}

			<DeleteConfirmModal
				open={deleteConfirmOpen}
				dogName={post.dog_name}
				onCancel={handleCancelDelete}
				onConfirm={handleConfirmDelete}
				deleting={deleting}
			/>
		</>
	);
};
