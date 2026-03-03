import express from "express";
import { generateMail, getAllTemplates, getTemplate, sendMail } from "./mail.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = express.Router();
router.use(requireAuth);
router.get("/health", (req, res) => {
    res.send("Mail Route running properly");
});

router.post("/generateMail", generateMail);
router.get("/templates", getAllTemplates);
router.get("/template", getTemplate);
router.post("/sendMail", sendMail);

export default router;