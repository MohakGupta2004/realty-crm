import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requireRole from "../../shared/middleware/requireRole";
import { getMe, getAllUsers, updateOnboarding } from "./user.controller";

const router = Router();

// GET /user/me — current user profile
router.get("/me", requireAuth, getMe);

// GET /user/admin/users — admin-only: list all users
router.get("/admin/users", requireAuth, requireRole("ADMIN"), getAllUsers);

// PUT /user/onboarding — update onboarding data
router.put("/onboarding", requireAuth, updateOnboarding);

export default router;
