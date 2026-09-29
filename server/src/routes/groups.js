import { Router } from "express";
import * as controller from "../controllers/groups.js";
import { auth } from "../middleware/auth.js";

export const groupRoutes = Router();
groupRoutes.use(auth);
groupRoutes.get("/", controller.list);
groupRoutes.post("/", controller.create);
groupRoutes.get("/:id", controller.get);
groupRoutes.post("/:id/members", controller.addMember);
