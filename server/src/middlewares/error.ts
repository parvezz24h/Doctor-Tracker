import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";

import { isProduction } from "../config/env.js";
import { ApiError, type FieldError } from "../utils/api-error.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

// Express identifies error middleware by its four arguments.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = "Something went wrong. Please try again.";
  let errors: FieldError[] | undefined;

  if (error instanceof ApiError) {
    ({ statusCode, message, errors } = error);
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
    statusCode = 409;
    message = `A record with this ${field} already exists`;
    errors = [{ field, message: `This ${field} is already in use` }];
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.code === "LIMIT_FILE_SIZE" ? "Photo must be 5 MB or smaller" : "Upload failed";
    errors = [{ field: "photo", message }];
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Request body is not valid JSON";
  }

  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: !isProduction && statusCode >= 500 && error instanceof Error ? error.stack : undefined,
  });
}
