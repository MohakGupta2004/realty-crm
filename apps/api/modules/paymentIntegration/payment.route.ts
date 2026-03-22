import express from "express";
import { getPaymentUrl } from "./payment.controller";
import requireAuth from "../../shared/middleware/requireAuth";
const router = express.Router();

router.post("/create-payment-intent", requireAuth, getPaymentUrl);

export default router;
