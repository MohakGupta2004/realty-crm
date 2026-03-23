import express from "express";
import { getPaymentUrl, stripeWebhook } from "./payment.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

router.post("/createCheckoutSession", requireAuth, getPaymentUrl);

export default router;
