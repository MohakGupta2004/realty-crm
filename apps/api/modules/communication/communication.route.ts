import { Router } from "express";
import { getLeadCommunications } from "./communication.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

import { validate } from "../../shared/middleware/validate";
import { leadIdParamSchema } from "./communication.schema";

const router = Router();

router.use(requireAuth);
router.use(requirePro);

router.get("/lead/:leadId", validate({ params: leadIdParamSchema }), getLeadCommunications as any);

export default router;
