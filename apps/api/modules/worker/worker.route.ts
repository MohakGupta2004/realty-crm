import express from 'express'
import { sendMail } from './worker.controller';

import { validate } from "../../shared/middleware/validate";
import { sendMailSchema } from "./worker.schema";

const router = express.Router();

router.get("/health", (req, res) => {
    res.send("Worker Route running properly");
});

router.post("/send", validate({ body: sendMailSchema }), sendMail);

export default router;
