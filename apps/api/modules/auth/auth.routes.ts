import { Router } from "express";
import {
    register,
    login,
    refresh,
    logout,
    googleAuthStart,
    googleAuthCallback,
} from "./auth.controller";

import { validate } from "../../shared/middleware/validate";
import { registerSchema, loginSchema } from "./auth.types";

const router = Router();

// Email + Password
router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);

// Token management
router.post("/refresh", refresh);
router.post("/logout", logout);

// Google OAuth
router.get("/google", googleAuthStart);
router.get("/google/callback", googleAuthCallback);

export default router;
