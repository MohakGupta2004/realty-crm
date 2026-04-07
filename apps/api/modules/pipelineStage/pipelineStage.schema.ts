import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createPipelineStageSchema = z.object({
    name: z.string().min(1, "Stage name is required"),
    description: z.string().optional(),
    pipelineId: objectIdSchema,
    workspaceId: objectIdSchema,
    stageNumber: z.number().int().min(0),
    probability: z.number().min(0).max(100),
    isFinal: z.boolean().optional().default(false),
    colorIndex: z.number().int().min(0).optional().default(0),
});

export const updatePipelineStageSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
    isFinal: z.boolean().optional(),
    stageNumber: z.number().int().min(0).optional(),
    colorIndex: z.number().int().min(0).optional(),
});

export const reorderStagesSchema = z.object({
    pipelineId: objectIdSchema,
    stageOrder: z.array(objectIdSchema).min(1),
});

export const moveLeadSchema = z.object({
    leadId: objectIdSchema,
    targetStageId: objectIdSchema,
});

export const stageIdParamSchema = z.object({
    id: objectIdSchema,
});

export const pipelineIdParamSchema = z.object({
    pipelineId: objectIdSchema,
});
