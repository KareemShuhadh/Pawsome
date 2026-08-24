import { supabase } from "@/lib/supabase";

import { processImage } from "@/utils/imageUtils";

import {
	uploadImage,
	deleteImage,
} from "@/services/cloudinary.js";

import {
	insertPost,
	updatePostById,
	fetchPostImage,
	deletePostById,
} from "./postQueries";

/* Create a post and upload its image when needed. */

export const createPostMutation = async ({
	post,
	userId,
}) => {
	try {
		const {
			image,
			...postData
		} = post;

		let imageUrl = null;
		let imagePublicId = null;

		if (image) {
			const optimizedImage =
				await processImage(image);

			const cloudinaryResult =
				await uploadImage(
					optimizedImage,
					supabase
				);

			imageUrl =
				cloudinaryResult.imageUrl;

			imagePublicId =
				cloudinaryResult.imagePublicId;
		}

		const {
			data,
			error,
		} = await insertPost({
			...postData,
			user_id: userId,
			votes: 0,
			image_url: imageUrl,
			image_public_id:
				imagePublicId,
		});

		if (error) {
			return {
				data: null,
				error,
			};
		}

		return {
			data,
			error: null,
		};
	} catch (error) {
		return {
			data: null,
			error,
		};
	}
};

/* Update a post, optionally replacing its image. */

export const updatePostMutation = async ({
	id,
	updates,
	userId,
}) => {
	try {
		const {
			image,
			...postData
		} = updates;

		/* Update fields without replacing the image. */

		if (!image) {
			const {
				data,
				error,
			} = await updatePostById(
				id,
				userId,
				postData
			);

			if (error) {
				return {
					data: null,
					error,
				};
			}

			return {
				data,
				error: null,
			};
		}

		/* Get the existing image first. */

		const {
			data: existingPost,
			error: fetchError,
		} = await fetchPostImage(
			id,
			userId
		);

		if (fetchError) {
			return {
				data: null,
				error: fetchError,
			};
		}

		const oldImagePublicId =
			existingPost?.image_public_id ||
			null;

		/* Upload the replacement image. */

		const optimizedImage =
			await processImage(image);

		const cloudinaryResult =
			await uploadImage(
				optimizedImage,
				supabase
			);

		const newImageUrl =
			cloudinaryResult.imageUrl;

		const newImagePublicId =
			cloudinaryResult.imagePublicId;

		/* Save the replacement image metadata. */

		const {
			data,
			error,
		} = await updatePostById(
			id,
			userId,
			{
				...postData,
				image_url:
					newImageUrl,
				image_public_id:
					newImagePublicId,
			}
		);

		if (error) {
			/* Clean up the newly uploaded image. */

			try {
				await deleteImage(
					newImagePublicId,
					supabase
				);
			} catch (cleanupError) {
				console.error(
					"Failed to clean up newly uploaded image:",
					cleanupError
				);
			}

			return {
				data: null,
				error,
			};
		}

		/* Remove the old image after success. */

		if (
			oldImagePublicId &&
			oldImagePublicId !==
				newImagePublicId
		) {
			try {
				await deleteImage(
					oldImagePublicId,
					supabase
				);
			} catch (deleteError) {
				console.error(
					"Post updated, but failed to delete old Cloudinary image:",
					deleteError
				);
			}
		}

		return {
			data,
			error: null,
		};
	} catch (error) {
		return {
			data: null,
			error,
		};
	}
};

/* Delete a post and its image. */

export const deletePostMutation = async ({
	id,
	userId,
}) => {
	try {
		const {
			data: post,
			error: fetchError,
		} = await fetchPostImage(
			id,
			userId
		);

		if (fetchError) {
			return {
				error: fetchError,
			};
		}

		/* Delete the Cloudinary image first. */

		if (post?.image_public_id) {
			await deleteImage(
				post.image_public_id,
				supabase
			);
		}

		/* Delete the database row. */

		const {
			error,
		} = await deletePostById(
			id,
			userId
		);

		if (error) {
			return {
				error,
			};
		}

		return {
			error: null,
		};
	} catch (error) {
		return {
			error,
		};
	}
};
