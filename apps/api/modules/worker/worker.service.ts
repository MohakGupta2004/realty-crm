import { Resend } from "resend";
import { CampaignBatch } from "../campaign/models/campaignBatch.model";
import { Lead } from "../lead/lead.model";
import { Campaing } from "../campaign/models/campaign.model";
import { User } from "../user/user.model";
import { CampaignStep } from "../campaign/models/campaignStep.model";
import { env } from "../../shared/config/env.config";

const resend = new Resend(env.RESEND_API_KEY);

export class WorkerService {

    static async sendBatchEmailWithRetry(batchId: string): Promise<void> {

        const batchDoc = await CampaignBatch.findOneAndUpdate(
            { _id: batchId, status: "queued" },
            { $set: { status: "processing" } },
            { new: true }
        ).populate([
            { path: "stepId", select: "subject body" },
            {
                path: "campaignId",
                select: "userId",
                populate: { path: "userId", select: "email" }
            }
        ]).lean();

        if (!batchDoc) return;

        const step = batchDoc.stepId as any;
        if (!step) {
            throw new Error(`Campaign step not found for batch id: ${batchId}`);
        }

        const userEmail = (batchDoc.campaignId as any)?.userId?.email;

        const leads = batchDoc.leads || [];

        const leadIds = leads.map((l: any) => l.leadId);

        const leadDocs = await Lead.find({ _id: { $in: leadIds } }).select("_id isUnsubscribed").lean();
        const unsubscribedLeadIds = new Set(
            leadDocs.filter(d => Boolean(d.isUnsubscribed)).map(d => d._id.toString())
        );

        const backendUrl = env.BACKEND_URL || "http://localhost:3000";

        const filteredLeads = leads.filter((l: any) => l?.email && !unsubscribedLeadIds.has(l.leadId.toString()));

        if (filteredLeads.length === 0) {
            await CampaignBatch.findByIdAndUpdate(batchId, { status: "failed" });
            return;
        }

        const systemReplyEmail = env.REPLY_TO_EMAIL || "replies@yourdomain.com";

        const batchPayload = filteredLeads.map((lead: any) => {
            const trackingPixel = `<img src="${backendUrl}/api/v1/campaign/track/${batchId}/${lead.leadId}?cb=${Date.now()}" width="1" height="1" style="display:none; visibility:hidden;" alt="" />`;
            const unsubscribeLink = `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; font-family: sans-serif;"><p>If you no longer wish to receive these emails, you can <a href="${backendUrl}/api/v1/campaign/unsubscribe/${lead.leadId}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p></div>`;

            const compiledHtml = step.body?.replace("{{name}}", lead.name || "there") + unsubscribeLink + trackingPixel;

            return {
                from: env.EMAIL_FROM || "CRM <noreply@yourdomain.com>",
                to: [lead.email],
                subject: step.subject,
                html: compiledHtml,
                reply_to: systemReplyEmail,
                ...(userEmail && {
                    cc: [userEmail]
                })
            };
        });

        try {

            const { data, error } = await resend.batch.send(batchPayload);

            if (error) {
                throw error;
            }

            if (data && Array.isArray(data)) {
                const bulkOps = data
                    .map((res: any, index: number) => {
                        const lead = filteredLeads[index];
                        if (!lead) return null;

                        return {
                            updateOne: {
                                filter: { _id: batchId, "leads.leadId": lead.leadId },
                                update: { $set: { "leads.$.messageId": res.id } }
                            }
                        };
                    })
                    .filter(Boolean) as any[];

                if (bulkOps.length > 0) {
                    await CampaignBatch.bulkWrite(bulkOps);
                }
            }

            await CampaignBatch.findByIdAndUpdate(batchId, {
                status: "sent"
            });

        } catch (error) {

            await CampaignBatch.findByIdAndUpdate(batchId, {
                status: "failed"
            });

            throw error;
        }
    }
}