import express from "express";
import rateLimit from "express-rate-limit";
import { trackBatch, identifyVisitor, getWorkspaceEvents, getWorkspaceVisitors } from "./tracker.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200
});

router.use("/api/track-batch", limiter);
router.use("/api/identify", limiter);

router.post("/api/track-batch", trackBatch);
router.post("/api/identify", identifyVisitor);

router.get("/api/v1/trackers/workspace/:workspaceId/events", requireAuth, getWorkspaceEvents);
router.get("/api/v1/trackers/workspace/:workspaceId/visitors", requireAuth, getWorkspaceVisitors);

export default router;