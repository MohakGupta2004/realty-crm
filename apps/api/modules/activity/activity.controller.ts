import type { Request, Response } from "express";
import { ActivityService } from "./activity.service";

export async function getLeadActivities(req: Request, res: Response) {
    try {
        const { leadId } = req.params;
        if (!leadId) {
            res.status(400).json({ message: "leadId is required" });
            return;
        }
        const activities = await ActivityService.getActivitiesByLead(leadId as string);
        res.status(200).json({ activities });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Failed to fetch activities" });
    }
}
