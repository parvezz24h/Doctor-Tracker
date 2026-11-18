import { Router } from "express";
import { z } from "zod";

import { sendSuccess } from "../../utils/response.js";
import { getDashboardStats } from "./dashboard.service.js";

const statsQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const dashboardRouter = Router();

dashboardRouter.get("/stats", async (req, res) => {
  const { days } = statsQuery.parse(req.query);
  sendSuccess(res, await getDashboardStats(days));
});
