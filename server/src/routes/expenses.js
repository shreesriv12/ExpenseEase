import { Router } from "express";
import * as controller from "../controllers/expenses.js";
import { auth } from "../middleware/auth.js";
import { asyncRoute } from "../utils/asyncRoute.js";
export const expenseRoutes = Router();
expenseRoutes.get("/groups/:id/expenses", auth, asyncRoute(controller.list));
expenseRoutes.post("/groups/:id/expenses", auth, asyncRoute(controller.create));
expenseRoutes.put("/expenses/:id", auth, asyncRoute(controller.update));
expenseRoutes.delete("/expenses/:id", auth, asyncRoute(controller.remove));
