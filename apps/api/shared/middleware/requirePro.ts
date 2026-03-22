import type { NextFunction, Response } from "express";
import { User } from "../../modules/user/user.model";
import type { AuthenticatedRequest } from "./requireAuth";

async function requirePro(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        if (user.subscriptionPlan !== "pro" && user.subscriptionPlan !== "enterprise") {
            res.status(403).json({ message: "This action requires a Pro subscription" });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export default requirePro;
