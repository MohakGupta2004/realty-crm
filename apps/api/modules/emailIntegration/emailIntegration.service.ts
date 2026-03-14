import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { env } from "../../shared/config/env.config";
import { EmailIntegration } from "./emailIntegration.model";
import type { Types } from "mongoose";
import { EmailHistory } from "./emailHistory.model";
import { Lead } from "../lead/lead.model";
import { redisClient } from "../../shared/config/redis.client";

class EmailIntegrationService {
    private getOAuthClient(): OAuth2Client {
        return new google.auth.OAuth2(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/v1/auth/google/callback"
        );
    }

    public getAuthUrl(userId: string): string {
        const oauth2Client = this.getOAuthClient();

        const scopes = [
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
        ];

        return oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: scopes,
            state: JSON.stringify({ userId, intent: "email_integration" }),
        });
    }

    public async handleCallback(code: string, userId: string): Promise<void> {
        const oauth2Client = this.getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: "v2",
        });

        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        if (!email) {
            throw new Error("Could not retrieve email address from Google");
        }

        const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

        await EmailIntegration.findOneAndUpdate(
            { userId },
            {
                email,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                ...(expiresAt && { expiresAt }),
            },
            {
                upsert: true,
                new: true,
            }
        );
    }

    public async getClientForUser(userId: string | Types.ObjectId, preloadedIntegration?: any): Promise<OAuth2Client> {
        let integration = preloadedIntegration;
        if (!integration) {
            integration = await EmailIntegration.findOne({ userId });
        }
        if (!integration) {
            throw new Error("Email integration not found for user. Please connect your Gmail account.");
        }

        const oauth2Client = this.getOAuthClient();
        oauth2Client.setCredentials({
            access_token: integration.accessToken,
            refresh_token: integration.refreshToken,
            expiry_date: integration.expiresAt?.getTime(),
        });

        oauth2Client.on('tokens', async (tokens) => {
            const updatePayload: any = { accessToken: tokens.access_token };
            if (tokens.refresh_token) {
                updatePayload.refreshToken = tokens.refresh_token;
            }
            if (tokens.expiry_date) {
                updatePayload.expiresAt = new Date(tokens.expiry_date);
            }
            await EmailIntegration.findOneAndUpdate({ userId }, updatePayload);

            const updatedDoc = await EmailIntegration.findOne({ userId });
            if (updatedDoc) {
                await redisClient.set(`email_integration:${updatedDoc.email}`, JSON.stringify(updatedDoc), 'EX', 2700);
            }
        });

        return oauth2Client;
    }

    public async sendEmail(userId: string | Types.ObjectId, to: string, subject: string, body: string): Promise<void> {
        const auth = await this.getClientForUser(userId);
        const gmail = google.gmail({ version: 'v1', auth });

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            body,
        ];

        const message = messageParts.join('\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
    }

    public async handlePushNotification(emailAddress: string, historyId: string): Promise<void> {
        const cacheKey = `email_integration:${emailAddress}`;
        let integrationDoc: any;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            integrationDoc = JSON.parse(cachedData);
        } else {
            const dbIntegration = await EmailIntegration.findOne({ email: emailAddress });
            if (!dbIntegration) {
                console.warn(`Webhook received for unknown email: ${emailAddress}`);
                return;
            }
            integrationDoc = dbIntegration.toObject();
            await redisClient.set(cacheKey, JSON.stringify(integrationDoc), 'EX', 2700);
        }

        const auth = await this.getClientForUser(integrationDoc.userId, integrationDoc);
        const gmail = google.gmail({ version: 'v1', auth });

        const startHistoryId = integrationDoc.lastHistoryId;

        if (!startHistoryId) {
            await EmailIntegration.updateOne({ email: emailAddress }, { lastHistoryId: historyId });
            integrationDoc.lastHistoryId = historyId;
            await redisClient.set(cacheKey, JSON.stringify(integrationDoc), 'EX', 2700);
            return;
        }

        try {
            const historyResponse = await gmail.users.history.list({
                userId: 'me',
                startHistoryId,
                historyTypes: ['messageAdded'],
            });

            const history = historyResponse.data.history || [];
            const emailRecordsToInsert: any[] = [];

            const parsedMessages: { senderEmail: string; subject: string; body: string; messageId: string }[] = [];
            const uniqueSenderEmails = new Set<string>();

            for (const record of history) {
                if (record.messagesAdded) {
                    for (const msgAdded of record.messagesAdded) {
                        const messageId = msgAdded.message?.id;
                        if (!messageId) continue;

                        const messageData = await gmail.users.messages.get({
                            userId: 'me',
                            id: messageId,
                            format: 'full',
                        });

                        const payload = messageData.data.payload;
                        const headers = payload?.headers || [];
                        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
                        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');

                        const from = fromHeader?.value || '';
                        const subject = subjectHeader?.value || '';

                        const emailMatch = from.match(/<(.+)>/);
                        const senderEmail = (emailMatch?.[1] || from || '').toLowerCase().trim();

                        if (!senderEmail) continue;

                        let body = '';
                        if (payload?.parts) {
                            const part = payload.parts.find(p => p.mimeType === 'text/plain' || p.mimeType === 'text/html');
                            if (part?.body?.data) {
                                body = Buffer.from(part.body.data, 'base64').toString('utf8');
                            }
                        } else if (payload?.body?.data) {
                            body = Buffer.from(payload.body.data, 'base64').toString('utf8');
                        }

                        parsedMessages.push({
                            senderEmail,
                            subject: subject || 'No Subject',
                            body: body || 'No Content',
                            messageId,
                        });
                        uniqueSenderEmails.add(senderEmail);
                    }
                }
            }

            if (uniqueSenderEmails.size > 0) {
                // Find all matching leads in one single DB call
                const leads = await Lead.find({
                    email: { $in: Array.from(uniqueSenderEmails) },
                    realtorId: integrationDoc.userId
                });

                // Group leads by email 
                const leadsByEmail = new Map<string, any[]>();
                for (const lead of leads) {
                    const email = lead.email.toLowerCase().trim();
                    if (!leadsByEmail.has(email)) {
                        leadsByEmail.set(email, []);
                    }
                    leadsByEmail.get(email)!.push(lead);
                }

                for (const msg of parsedMessages) {
                    const matchedLeads = leadsByEmail.get(msg.senderEmail) || [];
                    for (const lead of matchedLeads) {
                        emailRecordsToInsert.push({
                            leadId: lead._id,
                            realtorId: integrationDoc.userId,
                            subject: msg.subject,
                            body: msg.body,
                            senderEmail: msg.senderEmail,
                            messageId: msg.messageId,
                        });
                    }
                }
            }

            if (emailRecordsToInsert.length > 0) {
                await EmailHistory.insertMany(emailRecordsToInsert, { ordered: false }).catch((err) => {
                    if (err.code !== 11000) {
                        console.error("Partial bulk insert error", err);
                    }
                });
            }

            await EmailIntegration.updateOne({ email: emailAddress }, { lastHistoryId: historyId });
            integrationDoc.lastHistoryId = historyId;
            await redisClient.set(cacheKey, JSON.stringify(integrationDoc), 'EX', 2700);

        } catch (error: any) {
            console.error('Error fetching Gmail history:', error);
            if (error.code === 404) {
                await EmailIntegration.updateOne({ email: emailAddress }, { lastHistoryId: historyId });
                integrationDoc.lastHistoryId = historyId;
                await redisClient.set(cacheKey, JSON.stringify(integrationDoc), 'EX', 2700);
            }
        }
    }
}

export const emailIntegrationService = new EmailIntegrationService();
