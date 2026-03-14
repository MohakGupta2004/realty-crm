import { Router } from "express";
import { getGoogleAuthUrl, getIntegrationStatus, receiveWebhook, sendEmailToLead } from "./emailIntegration.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = Router();

router.post('/webhook/receive', receiveWebhook as any);

// Protected routes below
router.use(requireAuth);

router.get("/google/auth-url", getGoogleAuthUrl as any);
router.get("/status", getIntegrationStatus as any);
router.post("/send", sendEmailToLead as any);

export default router;
