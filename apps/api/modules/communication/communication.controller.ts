import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/requireAuth";
import { CommunicationService } from "./communication.service";

export async function getLeadCommunications(req: AuthenticatedRequest, res: Response) {
    try {
        const { leadId } = req.params;
        if (!leadId) {
            res.status(400).json({ message: "leadId is required" });
            return;
        }
        const communications = await CommunicationService.getCommunicationsByLead(leadId as string);
        res.status(200).json({ communications });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Failed to fetch communications" });
    }
}
