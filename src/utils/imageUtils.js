const MAX_FILE_SIZE_MB = 10;
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.85;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);

        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
                new Error(
                    "Could not read the image."
                )
            );
        };

        img.src = url;
    });
}

export async function processImage(file) {
    if (!file) {
        throw new Error("No image was provided.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
            "Only JPG, PNG, and WebP images are allowed."
        );
    }

    const fileSizeMB =
        file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(
            `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`
        );
    }

    const img = await loadImage(file);

    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if (
        width > MAX_DIMENSION ||
        height > MAX_DIMENSION
    ) {
        const scale = Math.min(
            MAX_DIMENSION / width,
            MAX_DIMENSION / height
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Could not process the image."
        );
    }

    ctx.drawImage(
        img,
        0,
        0,
        width,
        height
    );

    const blob = await new Promise(
        (resolve, reject) => {
            canvas.toBlob(
                (result) => {
                    if (!result) {
                        reject(
                            new Error(
                                "Could not convert image to WebP."
                            )
                        );
                        return;
                    }

                    resolve(result);
                },
                "image/webp",
                WEBP_QUALITY
            );
        }
    );

    return new File(
        [blob],
        "pawsome-image.webp",
        {
            type: "image/webp",
            lastModified: Date.now(),
        }
    );
}
