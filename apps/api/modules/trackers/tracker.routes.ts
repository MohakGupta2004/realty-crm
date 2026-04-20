import express from "express";
import rateLimit from "express-rate-limit";
import {
  trackBatch,
  identifyVisitor,
  getWorkspaceEvents,
  getWorkspaceVisitors,
  generateApiKey,
  getTrackerDetails,
  getDashboardStats,
  getLeadEngagement,
} from "./tracker.controller";
import requireAuth from "../../shared/middleware/requireAuth";

import { validate } from "../../shared/middleware/validate";
import {
  trackBatchSchema,
  identifyVisitorSchema,
  workspaceIdParamSchema,
  generateApiKeySchema,
  paginationQuerySchema,
} from "./tracker.schema";

const router = express.Router();

// const limiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 200
// });

// router.use("/track-batch", limiter);
// router.use("/identify", limiter);

router.post("/track-batch", validate({ body: trackBatchSchema }), trackBatch);
router.post(
  "/identify",
  validate({ body: identifyVisitorSchema }),
  identifyVisitor,
);

router.get(
  "/workspace/:workspaceId/events",
  requireAuth,
  validate({ params: workspaceIdParamSchema, query: paginationQuerySchema }),
  getWorkspaceEvents,
);
router.get(
  "/workspace/:workspaceId/visitors",
  requireAuth,
  validate({ params: workspaceIdParamSchema, query: paginationQuerySchema }),
  getWorkspaceVisitors,
);
router.get(
  "/workspace/:workspaceId/dashboard-stats",
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  getDashboardStats,
);
router.get(
  "/workspace/:workspaceId/lead-engagement",
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  getLeadEngagement,
);

router.post(
  "/generate-api-key",
  requireAuth,
  validate({ body: generateApiKeySchema }),
  generateApiKey,
);
router.get(
  "/workspace/:workspaceId/tracker-details",
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  getTrackerDetails,
);

export default router;
