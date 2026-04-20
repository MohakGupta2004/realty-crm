import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requireRole from "../../shared/middleware/requireRole";
import { getMe, getProMe, getAllUsers, updateOnboarding, updateMe, deleteMe } from "./user.controller";
import { requireProUser } from "./user.middleware";

import { validate } from "../../shared/middleware/validate";
import { updateUserSchema } from "./user.schema";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, validate({ body: updateUserSchema }), updateMe);
router.patch("/me", requireAuth, validate({ body: updateUserSchema }), updateMe);
router.put("/onboarding", requireAuth, validate({ body: updateUserSchema }), updateOnboarding);

// GET /user/me/pro — current pro user profile
router.get("/me/pro", requireAuth, requireProUser, getProMe);

// DELETE /user/me — delete current user account
router.delete("/me", requireAuth, deleteMe);

export default router;
