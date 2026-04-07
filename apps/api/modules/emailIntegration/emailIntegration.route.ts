import { Router } from "express";
import {
    getGoogleAuthUrl,
    getIntegrationStatus,
    receiveWebhook,
    sendEmailToLead,
    processWebhookWorker,
    renewWatches,
} from "./emailIntegration.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

const router = Router();
import { validate } from "../../shared/middleware/validate";
import { sendEmailToLeadSchema, webhookReceiveSchema, webhookWorkerSchema } from "./emailIntegration.schema";

// ── Public webhook endpoints (authenticated via Pub/Sub JWT or internal secret) ──
router.post("/webhook/receive", validate({ body: webhookReceiveSchema }), receiveWebhook as any);
router.post("/webhook/worker", validate({ body: webhookWorkerSchema }), processWebhookWorker as any);
router.post("/webhook/renew-watches", renewWatches as any);

// ── Protected routes (authenticated via user JWT) ──
router.use(requireAuth);
router.use(requirePro);

router.get("/google/auth-url", getGoogleAuthUrl as any);
router.get("/status", getIntegrationStatus as any);
router.post("/send", validate({ body: sendEmailToLeadSchema }), sendEmailToLead as any);

export default router;
