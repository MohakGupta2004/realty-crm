import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createLeadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    source: z.string().min(1, "Source is required"),
    city: z.string().optional(),
    workspaceId: objectIdSchema,
    pipelineId: objectIdSchema.optional(),
    stageId: objectIdSchema.optional(),
    type: z.enum(["BUYER", "SELLER"]).optional(),
});

export const updateLeadSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
    city: z.string().optional(),
    pipelineId: objectIdSchema.optional(),
    stageId: objectIdSchema.optional(),
    status: z.string().optional(),
    extra_fields: z.record(z.string(), z.string()).optional(),
});

export const addLeadsSchema = z.object({
    leads: z.array(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        city: z.string().optional(),
        source: z.string().optional(),
    })),
    workspaceId: objectIdSchema,
    pipelineId: objectIdSchema.optional(),
    campaignId: objectIdSchema.optional(),
});

export const assignCampaignSchema = z.object({
    leads: z.array(objectIdSchema),
    campaignId: objectIdSchema,
    workspaceId: objectIdSchema,
});

export const leadIdParamSchema = z.object({
    id: objectIdSchema,
});

export const workspaceIdParamSchema = z.object({
    workspaceId: objectIdSchema,
});

export const campaignAndWorkspaceParamSchema = z.object({
    campaignId: objectIdSchema,
    workspaceId: objectIdSchema,
});
