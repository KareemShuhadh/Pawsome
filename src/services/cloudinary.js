export async function uploadImage(file, supabase) {
  if (!file) {
    throw new Error("No image provided.");
  }

  // 1. Ask our Supabase Edge Function for a Cloudinary signature
  const { data: signatureData, error: signatureError } =
    await supabase.functions.invoke("cloudinary-signature");

  if (signatureError) {
    console.error(
      "Failed to get Cloudinary signature:",
      signatureError
    );

    throw new Error("Could not prepare image upload.");
  }

  if (!signatureData) {
    throw new Error("No Cloudinary signature was returned.");
  }

  const {
    cloudName,
    apiKey,
    timestamp,
    signature,
  } = signatureData;

  // 2. Prepare the Cloudinary upload
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  // 3. Upload directly to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  // 4. Handle Cloudinary errors
  if (!response.ok) {
    const errorData = await response.json();

    console.error("Cloudinary upload failed:", errorData);

    throw new Error(
      errorData?.error?.message || "Image upload failed."
    );
  }

  // 5. Get Cloudinary's response
  const result = await response.json();

  // 6. Return only what our application needs
  return {
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  };
}

export async function deleteImage(publicId, supabase) {
	if (!publicId) {
		return;
	}

	const { data, error } =
		await supabase.functions.invoke(
			"cloudinary-delete",
			{
				body: {
					publicId,
				},
			}
		);

	if (error) {
		console.error(
			"Failed to delete Cloudinary image:",
			error
		);

		throw new Error(
			"Could not delete image from Cloudinary."
		);
	}

	if (!data?.success) {
		throw new Error(
			data?.error ||
				"Cloudinary image deletion failed."
		);
	}

	return data;
}