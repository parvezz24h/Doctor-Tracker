import { createAuthClient } from "better-auth/react";

// Same-origin: `/api/auth/*` is proxied to the Express server by Next.js.
export const authClient = createAuthClient();
