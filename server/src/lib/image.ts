import sharp from "sharp";

import { ApiError } from "../utils/api-error.js";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Turns an uploaded image into a small square WebP. Decoding the file also proves it
 * is a real image, whatever its name or declared type says.
 */
export async function toProfilePhoto(input: Buffer) {
  try {
    return await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate() // respect the camera orientation
      .resize(256, 256, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw ApiError.badRequest("This file is not a valid image", [
      { field: "photo", message: "Choose a JPG, PNG or WebP image" },
    ]);
  }
}
