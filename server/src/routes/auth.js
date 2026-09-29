import { Router } from "express";
import { register, login, me } from "../controllers/auth.js";
import { auth } from "../middleware/auth.js";
export const authRoutes = Router();
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", auth, me);
