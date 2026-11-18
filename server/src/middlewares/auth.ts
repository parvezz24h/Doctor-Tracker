import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ADMIN_ROLE, getAuth } from "../lib/auth.js";
import { ApiError } from "../utils/api-error.js";

/** Authentication: rejects requests without a valid session. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await getAuth().api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) throw ApiError.unauthorized();

  res.locals.user = session.user;
  res.locals.session = session.session;
  next();
}

/** Authorization: only administrators may use the portal API. */
export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.role !== ADMIN_ROLE) throw ApiError.forbidden();
  next();
}
