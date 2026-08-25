import imageCompression from "browser-image-compression";

const MAX_FILE_SIZE_MB = 10;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
];

export async function processImage(file) {
    if (!file) {
        throw new Error("No image was provided.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
            "Only JPG, PNG, WebP, HEIC, and HEIF images are allowed."
        );
    }

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(
            `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`
        );
    }

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.85,
        exifOrientation: undefined,
    };

    const compressedFile =
        await imageCompression(file, options);

    return compressedFile;
}
