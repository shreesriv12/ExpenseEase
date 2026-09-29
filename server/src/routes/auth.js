import { Router } from "express";
import { register, login, me } from "../controllers/auth.js";
import { auth } from "../middleware/auth.js";
import { asyncRoute } from "../utils/asyncRoute.js";
export const authRoutes = Router();
authRoutes.post("/register", asyncRoute(register));
authRoutes.post("/login", asyncRoute(login));
authRoutes.get("/me", auth, asyncRoute(me));
