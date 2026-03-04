import { Types } from "mongoose";
import {z} from 'zod'
export type TPipelineType = "BUYER" | "SELLER";

export interface IPipeline {
    name: string;
    type: TPipelineType;
    workspaceId: Types.ObjectId;
    realtorId: Types.ObjectId;
}

export const createPipelineSchema = z.object({
    name: z.string(),
    type: z.enum(["BUYER", "SELLER"]),
    workspaceId: z.string(),
})

export const updatePipelineSchema = z.object({
    name: z.string(),
    type: z.enum(["BUYER", "SELLER"]),
})

export const getPipelineDetailsSchema = z.object({
    id: z.string(),
})

export const deletePipelineSchema = z.object({
    id: z.string(),
})

export const getPipelinesSchema = z.object({
    workspaceId: z.string(),
})
