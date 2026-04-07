import express from "express";
import { getPaymentUrl, stripeWebhook, createPortalSessionHandler } from "./payment.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

import { validate } from "../../shared/middleware/validate";
import { createCheckoutSessionSchema } from "./payment.schema";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

router.post("/createCheckoutSession", requireAuth, validate({ body: createCheckoutSessionSchema }), getPaymentUrl);
router.post("/createPortalSession", requireAuth, requirePro, createPortalSessionHandler);

export default router;
