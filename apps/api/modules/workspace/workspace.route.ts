import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import { createWorkspace, getWorkspace } from "./workspace.controller";

const router = Router();

router.post("/create", requireAuth, createWorkspace);
router.get("/", requireAuth, getWorkspace);

export default router;