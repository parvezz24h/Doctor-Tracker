import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    // Indexes are created explicitly at startup (see ensureIndexes), not per model.
    autoIndex: false,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

/**
 * Creates any index declared on a model but missing in the database. Existing indexes
 * are left alone, so this is quick on every start and new indexes reach production
 * with the deploy that introduces them.
 */
export async function ensureIndexes() {
  const started = Date.now();
  await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
  console.log(`Indexes ready (${Date.now() - started} ms)`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
