import multer from "multer";

import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES } from "../lib/image.js";
import { ApiError } from "../utils/api-error.js";

/** Accepts one image in the "photo" field, kept in memory for processing. */
export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, done) => {
    if (PHOTO_MIME_TYPES.includes(file.mimetype)) done(null, true);
    else
      done(
        ApiError.badRequest("Unsupported file type", [
          { field: "photo", message: "Choose a JPG, PNG or WebP image" },
        ]),
      );
  },
}).single("photo");
