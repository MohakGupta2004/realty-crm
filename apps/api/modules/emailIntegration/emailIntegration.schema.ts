import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const sendEmailToLeadSchema = z.object({
  leadId: objectIdSchema,
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export const webhookReceiveSchema = z.object({
  message: z.object({
    data: z.string(),
    messageId: z.string().optional(),
    publishTime: z.string().optional(),
  }),
});

export const webhookWorkerSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.string().or(z.number()),
});
