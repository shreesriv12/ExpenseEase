import { Router } from "express";
import * as controller from "../controllers/groupData.js";
import { auth } from "../middleware/auth.js";
import { asyncRoute } from "../utils/asyncRoute.js";
export const groupDataRoutes = Router();
groupDataRoutes.get("/groups/:id/balances", auth, asyncRoute(controller.balances));
groupDataRoutes.post(
  "/groups/:id/settlements",
  auth,
  asyncRoute(controller.createSettlement),
);
groupDataRoutes.get("/groups/:id/activity", auth, asyncRoute(controller.activity));
groupDataRoutes.get("/dashboard/summary", auth, asyncRoute(controller.dashboard));
