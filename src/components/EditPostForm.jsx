import { useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
	Loader2,
	ImagePlus,
	X,
} from "lucide-react";

export const EditPostForm = ({
	post,
	onClose,
	onSave,
	showNotification,
}) => {
	const [dogName, setDogName] = useState(
		post.dog_name || ""
	);

	const [ownerName, setOwnerName] = useState(
		post.owner_name || ""
	);

	const [location, setLocation] = useState(
		post.location || ""
	);

	const [description, setDescription] = useState(
		post.description || ""
	);

	const [file, setFile] = useState(null);

	const [preview, setPreview] = useState(null);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const fileRef = useRef(null);

	/*
	 * Handle image selection.
	 */
	const handleFile = (selectedFile) => {
		if (!selectedFile) {
			return;
		}

		/*
		 * Make sure the selected file is an image.
		 */
		if (!selectedFile.type.startsWith("image/")) {
			setError("Please choose an image file.");

			if (fileRef.current) {
				fileRef.current.value = "";
			}

			return;
		}

		/*
		 * Maximum file size: 10MB.
		 */
		if (selectedFile.size > 10 * 1024 * 1024) {
			setError("Image must be under 10MB.");

			if (fileRef.current) {
				fileRef.current.value = "";
			}

			return;
		}

		/*
		 * Clean up the previous preview URL.
		 */
		if (preview) {
			URL.revokeObjectURL(preview);
		}

		setFile(selectedFile);

		/*
		 * Create a temporary preview URL.
		 */
		const previewUrl =
			URL.createObjectURL(selectedFile);

		setPreview(previewUrl);

		setError("");
	};

	/*
	 * Remove the newly selected replacement image.
	 */
	const handleRemoveNewImage = () => {
		if (preview) {
			URL.revokeObjectURL(preview);
		}

		setFile(null);
		setPreview(null);

		if (fileRef.current) {
			fileRef.current.value = "";
		}

		setError("");
	};

	/*
	 * Submit changes.
	 */
	const handleSubmit = async (event) => {
		event.preventDefault();

		if (
			!dogName.trim() ||
			!ownerName.trim() ||
			!location.trim()
		) {
			setError(
				"Please fill in all required fields."
			);

			return;
		}

		setSaving(true);
		setError("");

		const updates = {
			dog_name: dogName.trim(),
			owner_name: ownerName.trim(),
			location: location.trim(),
			description:
				description.trim() || null,
		};

		/*
		 * Only include an image when the user
		 * selected a replacement.
		 */
		if (file) {
			updates.image = file;
		}

		try {
			const result = await onSave(
				post.id,
				updates
			);

			if (result?.error) {
				setError(
					result.error.message ||
						"Could not update this post."
				);

				return;
			}

			/*
			 * Everything succeeded.
			 *
			 * Show the notification before closing
			 * the edit form.
			 */
			showNotification(
				"edit-success",
				"Your pup's post has been updated! 🐶✨"
			);

			onClose();
		} catch (err) {
			console.error(
				"Error updating post:",
				err
			);

			setError(
				err?.message ||
					"Could not update this post."
			);
		} finally {
			setSaving(false);
		}
	};

	const imageToDisplay =
		preview || post.image_url || null;

	return (
		<section className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/40 px-4 py-8 backdrop-blur-sm">
			<Card className="relative max-h-full w-full max-w-lg overflow-y-auto post-details-scrollbar p-6 shadow-card">

				<button
					type="button"
					onClick={onClose}
					disabled={saving}
					aria-label="Close edit form"
					className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
				>
					<X className="h-5 w-5" />
				</button>

				<h2 className="mb-1 pr-10 text-2xl font-bold">
					Edit your pup
				</h2>

				<p className="mb-6 text-sm text-muted-foreground">
					Update the details of your post.
				</p>

				<form
					onSubmit={handleSubmit}
					className="space-y-4"
				>
					{/* Dog name */}

					<section className="space-y-2">
						<Label htmlFor="edit-dog-name">
							Dog&apos;s name *
						</Label>

						<Input
							id="edit-dog-name"
							value={dogName}
							onChange={(event) =>
								setDogName(
									event.target.value
								)
							}
							maxLength={60}
						/>
					</section>

					{/* Owner name */}

					<section className="space-y-2">
						<Label htmlFor="edit-owner-name">
							Your name *
						</Label>

						<Input
							id="edit-owner-name"
							value={ownerName}
							onChange={(event) =>
								setOwnerName(
									event.target.value
								)
							}
							maxLength={60}
						/>
					</section>

					{/* Location */}

					<section className="space-y-2">
						<Label htmlFor="edit-location">
							Location *
						</Label>

						<Input
							id="edit-location"
							value={location}
							onChange={(event) =>
								setLocation(
									event.target.value
								)
							}
							maxLength={80}
						/>
					</section>

					{/* Description */}

					<section className="space-y-2">
						<Label htmlFor="edit-description">
							Description
						</Label>

						<Textarea
							id="edit-description"
							value={description}
							onChange={(event) =>
								setDescription(
									event.target.value
								)
							}
							maxLength={280}
							rows={4}
						/>

						<p className="text-right text-xs text-muted-foreground">
							{description.length}/280
						</p>
					</section>

					{/* Photo */}

					<section className="space-y-2">
						<Label>
							Photo
						</Label>

						<label
							htmlFor="edit-photo"
							className="relative flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-smooth hover:bg-muted"
						>
							{imageToDisplay ? (
								<>
									<img
										src={imageToDisplay}
										alt="Post preview"
										className="w-full max-h-72 object-cover"
									/>

									{preview && (
										<button
											type="button"
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();

												handleRemoveNewImage();
											}}
											disabled={saving}
											aria-label="Remove selected replacement image"
											className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black/90 disabled:opacity-50"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</>
							) : (
								<section className="p-6 text-center">
									<ImagePlus className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />

									<p className="text-sm font-medium">
										Click to upload a new photo
									</p>

									<p className="text-xs text-muted-foreground">
										PNG, JPG, WEBP — up to 10MB
									</p>
								</section>
							)}

							<input
								ref={fileRef}
								id="edit-photo"
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(event) =>
									handleFile(
										event.target.files?.[0] ?? null
									)
								}
							/>
						</label>

						{preview && (
							<p className="text-xs text-muted-foreground">
								New photo selected. It will replace
								the current photo when you save.
							</p>
						)}

						{!preview && post.image_url && (
							<p className="text-xs text-muted-foreground">
								Current photo. Choose another photo
								only if you want to replace it.
							</p>
						)}
					</section>

					{/* Error */}

					{error && (
						<p className="text-sm text-destructive">
							{error}
						</p>
					)}

					{/* Actions */}

					<footer className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							disabled={saving}
							className="rounded-xl border border-border px-4 py-2 font-bold hover:bg-secondary disabled:opacity-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
						>
							{saving && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}

							{saving
								? "Saving..."
								: "Save changes"}
						</button>
					</footer>
				</form>
			</Card>
		</section>
	);
};
