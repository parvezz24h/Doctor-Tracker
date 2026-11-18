import { connectDatabase, disconnectDatabase, ensureIndexes } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureBucket, isStorageEnabled } from "./lib/storage.js";
import { createApp } from "./app.js";

async function main() {
  await connectDatabase();
  const app = createApp();
  // Models register when the app's routes are imported, so this runs after createApp.
  await ensureIndexes();
  if (isStorageEnabled && env.NODE_ENV === "development") await ensureBucket();
  console.log(`Photo uploads: ${isStorageEnabled ? "enabled" : "disabled (storage not configured)"}`);

  const server = app.listen(env.PORT, () => {
    console.log(`Doctor Tracker API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start the server", error);
  process.exit(1);
});
