import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import { env, isProduction } from "./config/env.js";
import { getAuth } from "./lib/auth.js";
import { isStorageEnabled } from "./lib/storage.js";
import { requireAdmin, requireAuth } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { doctorRouter } from "./modules/doctors/doctor.routes.js";
import { patientRouter } from "./modules/patients/patient.routes.js";

export function createApp() {
  const app = express();

  // Requests arrive through the Next.js proxy; trust it for the client IP.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(compression());
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
  });

  // Slow down password guessing on the sign-in endpoint.
  app.use(
    "/api/auth/sign-in",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { success: false, message: "Too many sign-in attempts. Try again later." },
    }),
  );

  // Better Auth reads the raw request, so it is mounted before the JSON body parser.
  app.all("/api/auth/{*any}", toNodeHandler(getAuth()));

  app.use(express.json({ limit: "100kb" }));

  // Every REST endpoint requires an authenticated administrator.
  const api = express.Router();
  api.use(requireAuth, requireAdmin);
  // Optional features the client should show or hide.
  api.get("/meta", (_req, res) => {
    res.json({ success: true, data: { photoUploads: isStorageEnabled } });
  });
  api.use("/doctors", doctorRouter);
  api.use("/patients", patientRouter);
  api.use("/dashboard", dashboardRouter);
  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
