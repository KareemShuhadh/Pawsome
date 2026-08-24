import { AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export const DeleteConfirmModal = ({
	open,
	dogName,
	onCancel,
	onConfirm,
	deleting = false,
}) => {
	if (!open) return null;

	return (
		<section className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm">
			<Card className="relative w-full max-w-md rounded-2xl p-6 shadow-card">
				{/* Close button */}

				<button
					type="button"
					onClick={onCancel}
					disabled={deleting}
					aria-label="Close confirmation"
					className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
				>
					<X className="h-5 w-5" />
				</button>

				{/* Icon */}

				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
					<AlertTriangle className="h-6 w-6 text-destructive" />
				</div>

				{/* Message */}

				<h2 className="pr-8 text-xl font-bold">
					Delete this post?
				</h2>

				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					Are you sure you want to delete{" "}
					<span className="font-semibold text-foreground">
						{dogName}
					</span>
					&apos;s post? This action cannot be
					undone.
				</p>

				{/* Buttons */}

				<footer className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={deleting}
						className="rounded-xl border border-border px-4 py-2 font-bold transition-smooth hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={onConfirm}
						disabled={deleting}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 font-bold text-destructive-foreground shadow-soft transition-bounce hover:-translate-y-0.5 hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
					>
						{deleting ? (
							<>
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
								Deleting...
							</>
						) : (
							"Delete post"
						)}
					</button>
				</footer>
			</Card>
		</section>
	);
};
