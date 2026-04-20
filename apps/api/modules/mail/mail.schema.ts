import { z } from "zod";

export const generateMailSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
});

export const getTemplateSchema = z.object({
    type: z.string().min(1, "Template type is required"),
    subject: z.string().optional(),
    body: z.string().optional(),
});
