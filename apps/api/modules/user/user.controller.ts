import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/requireAuth";
import { userService } from "./user.service";

export async function getMe(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthenticatedRequest).user;
    res.json({ user: authUser });
}

export async function getAllUsers(
    _req: Request,
    res: Response,
): Promise<void> {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({
            totalUsers: users.length,
            users,
        });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateOnboarding(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const authUser = (req as AuthenticatedRequest).user;
        const userId = authUser._id.toString();
        const onboardingData = req.body;

        const updatedUser = await userService.updateOnboardingData(
            userId,
            onboardingData,
        );

        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "Onboarding data updated successfully",
            user: userService.toResponse(updatedUser),
        });
    } catch (error) {
        console.error("Onboarding update error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
