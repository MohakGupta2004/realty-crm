import { Types } from "mongoose";
import { z } from "zod";

export interface IPipelineStage {
    name: string;
    description: string;
    pipelineId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    stageNumber: number;
    probability: number;
    isFinal: boolean;
}

// ── Zod Schemas ───────────────────────────────────────────────────────

export const createPipelineStageSchema = z.object({
    name: z.string(),
    description: z.string(),
    pipelineId: z.string(),
    workspaceId: z.string(),
    stageNumber: z.number(),
    probability: z.number().min(0).max(100),
    isFinal: z.boolean().optional().default(false),
});

export const updatePipelineStageSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
    isFinal: z.boolean().optional(),
});

export const getPipelineStageSchema = z.object({
    id: z.string(),
});

export const getStagesByPipelineSchema = z.object({
    pipelineId: z.string(),
});

/** Bulk reorder stages within a pipeline (for drag-and-drop in Kanban) */
export const reorderStagesSchema = z.object({
    pipelineId: z.string(),
    /** Ordered array of stage IDs in the desired new order */
    stageOrder: z.array(z.string()).min(1),
});

/** Move a lead from one stage to another (Kanban card drag) */
export const moveLeadSchema = z.object({
    leadId: z.string(),
    targetStageId: z.string(),
});