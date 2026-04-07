import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createPipelineSchema = z.object({
    name: z.string().min(1, "Pipeline name is required"),
    type: z.enum(["BUYER", "SELLER"]),
    workspaceId: objectIdSchema,
    stages: z.array(z.object({
        name: z.string().min(1),
        probability: z.number().min(0).max(100),
        colorIndex: z.number().optional().default(0),
    })).optional(),
});

export const updatePipelineSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["BUYER", "SELLER"]).optional(),
});

export const pipelineIdParamSchema = z.object({
    id: objectIdSchema,
});

export const workspaceIdParamSchema = z.object({
    workspaceId: objectIdSchema,
});
