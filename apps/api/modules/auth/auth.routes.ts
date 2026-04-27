import { Router } from "express";
import {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    googleAuthStart,
    googleAuthCallback,
} from "./auth.controller";

import { validate } from "../../shared/middleware/validate";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.types";

const router = Router();

// Email + Password
router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);

// Password reset
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);

// Token management
router.post("/refresh", refresh);
router.post("/logout", logout);

// Google OAuth
router.get("/google", googleAuthStart);
router.get("/google/callback", googleAuthCallback);

export default router;
