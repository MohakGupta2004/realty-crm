import { Router } from "express";
import { getLeadCommunications } from "./communication.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/lead/:leadId", getLeadCommunications as any);

export default router;
