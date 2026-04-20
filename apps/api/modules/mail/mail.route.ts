import express from "express";
import { generateMail, getAllTemplates, getTemplate } from "./mail.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

import { validate } from "../../shared/middleware/validate";
import { generateMailSchema, getTemplateSchema } from "./mail.schema";

const router = express.Router();

router.get("/health", (req, res) => {
    res.send("Mail Route running properly");
});

router.use(requireAuth);
router.use(requirePro);

router.post("/generateMail", validate({ body: generateMailSchema }), generateMail);
router.get("/templates", getAllTemplates);
router.post("/template", validate({ body: getTemplateSchema }), getTemplate);
// router.post("/sendMail", sendMail);

export default router;