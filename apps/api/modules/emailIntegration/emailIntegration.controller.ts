import type { Request, Response } from "express";
import { emailIntegrationService } from "./emailIntegration.service";
import type { AuthenticatedRequest } from "../../shared/middleware/requireAuth";
import { EmailIntegration } from "./emailIntegration.model";
import { Lead } from "../lead/lead.model";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../shared/config/env.config";
import { CommunicationService } from "../communication/communication.service";
import { ActivityService } from "../activity/activity.service";
import { ActivityType } from "../activity/activity.types";

const authClient = new OAuth2Client();


export async function getGoogleAuthUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const url = emailIntegrationService.getAuthUrl(userId);
        res.status(200).json({ url });
    } catch (error: any) {
        console.error("Error generating Google Auth URL:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function getIntegrationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const integration = await EmailIntegration.findOne({ userId });

        if (!integration) {
            res.status(200).json({ isConnected: false });
            return;
        }

        res.status(200).json({ isConnected: true, email: integration.email });
    } catch (error: any) {
        console.error("Error fetching integration status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}



export async function sendEmailToLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { leadId, subject, body } = req.body;
        if (!leadId || !subject || !body) {
            res.status(400).json({ message: "Missing required fields: leadId, subject, body" });
            return;
        }
        const lead = await Lead.findById(leadId);

        if (!lead) {
            res.status(404).json({ message: "Lead not found" });
            return;
        }

        if (!lead.email) {
            res.status(400).json({ message: "Lead does not have an email address" });
            return;
        }
        await emailIntegrationService.sendEmail(userId, lead.email, subject, body);

        // Save communication record
        await CommunicationService.createCommunication({
            leadId,
            realtorId: userId,
            type: "EMAIL",
            subject,
            body
        });

        // Log activity
        await ActivityService.logActivity({
            leadId,
            realtorId: userId,
            type: ActivityType.EMAIL_SENT,
            content: `Sent email: ${subject}`
        });

        res.status(200).json({ message: "Email sent successfully" });
    } catch (error: any) {
        console.error("Error sending email via Gmail API:", error);
        const message = error.message || "Failed to send email";
        res.status(500).json({ message });
    }
}



export async function receiveWebhook(req: Request, res: Response): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Missing or invalid Authorization header" });
            return;
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Token missing from Authorization header" });
            return;
        }

        try {
            const audienceStr: string = env.BACKEND_URL ? `${env.BACKEND_URL}/api/v1/email-integration/webhook/receive` : 'http://localhost:3000/api/v1/email-integration/webhook/receive';
            const ticket: any = await authClient.verifyIdToken({
                idToken: token as string,
                audience: audienceStr,
            });
            const payload = ticket.getPayload();

            if (!payload || !payload.email_verified) {
                res.status(403).json({ message: "Invalid token payload" });
                return;
            }
        } catch (authError) {
            console.error("Webhook authentication failed:", authError);
            res.status(403).json({ message: "Forbidden: Invalid token" });
            return;
        }

        const message = req.body?.message;
        if (!message || !message.data) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        const dataStr = Buffer.from(message.data, 'base64').toString('utf8');
        const data = JSON.parse(dataStr);
        const { emailAddress, historyId } = data;

        if (emailAddress && historyId) {
            await emailIntegrationService.handlePushNotification(emailAddress, historyId.toString());
        }

        res.status(200).send("OK");
    } catch (error: any) {
        console.error("Error receiving webhook:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}