import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const trackBatchSchema = z.object({
  apiKey: z.string().min(1).max(100),
  visitorId: z.string().min(1).max(100),
  events: z.array(z.object({
    type: z.string(),
    url: z.string().optional(),
    path: z.string().optional(),
    title: z.string().optional(),
    referrer: z.string().optional(),
    metadata: z.any().optional(),
    timestamp: z.coerce.number().optional(),
  })).min(1).max(50),
});

export const identifyVisitorSchema = z.object({
  apiKey: z.string().min(1).max(100),
  visitorId: z.string().min(1).max(100),
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

export const generateApiKeySchema = z.object({
  workspaceId: objectIdSchema,
  domain: z.string().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || "1")),
  limit: z.string().optional().transform(v => parseInt(v || "50")),
});
