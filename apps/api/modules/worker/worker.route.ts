import express from 'express'
import { sendMail } from './worker.controller';

const router = express.Router();

router.get("/health", (req, res) => {
    res.send("Worker Route running properly");
});

router.post("/send", sendMail);

export default router;
