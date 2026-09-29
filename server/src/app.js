import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./routes/auth.js";
import { groupRoutes } from "./routes/groups.js";
import { expenseRoutes } from "./routes/expenses.js";
import { groupDataRoutes } from "./routes/groupData.js";
import { errors } from "./middleware/errors.js";
export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    handler: (req, res) =>
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please wait a minute and try again.",
        },
      }),
  }),
  authRoutes,
);
app.use("/api/groups", groupRoutes);
app.use("/api", expenseRoutes);
app.use("/api", groupDataRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use(errors);
