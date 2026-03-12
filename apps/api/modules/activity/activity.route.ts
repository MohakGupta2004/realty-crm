import { Router } from "express";
import { getLeadActivities } from "./activity.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/lead/:leadId", getLeadActivities as any);

export default router;
