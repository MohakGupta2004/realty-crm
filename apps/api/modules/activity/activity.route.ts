import { Router } from "express";
import { getLeadActivities } from "./activity.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

import { validate } from "../../shared/middleware/validate";
import { leadIdParamSchema } from "./activity.schema";

const router = Router();

router.use(requireAuth);
router.use(requirePro);

router.get("/lead/:leadId", validate({ params: leadIdParamSchema }), getLeadActivities as any);

export default router;
