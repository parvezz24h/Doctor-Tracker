import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

import { env } from "../config/env.js";

export const ADMIN_ROLE = "admin";

/**
 * Builds the Better Auth instance on top of the already-open mongoose connection,
 * so the whole server shares a single MongoDB connection pool.
 */
export function createAuth(options: { allowSignUp?: boolean } = {}) {
  const db = mongoose.connection.getClient().db();

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db),
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // No public registration: accounts are created by the seed script.
      disableSignUp: !options.allowSignUp,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: ADMIN_ROLE,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/** Lazily created so it is only built after the database connection is open. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
