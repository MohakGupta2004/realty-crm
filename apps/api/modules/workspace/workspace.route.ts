import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import { createWorkspace } from "./workspace.controller";

const router = Router();

router.post("/create", requireAuth, createWorkspace);

export default router;