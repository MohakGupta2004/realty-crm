import type { Request, Response } from "express";
import { Pipeline } from "./pipeline.model";
import type { AuthenticatedRequest } from "../../shared/middleware/requireAuth";
import { createPipelineSchema, getPipelineDetailsSchema, getPipelinesSchema, updatePipelineSchema } from "./pipeline.types";


export const createPipeline = async (req: Request, res: Response) => {
    try {
        const { name, type, workspaceId } = createPipelineSchema.parse(req.body);
        const realtorId = (req as AuthenticatedRequest).user.id;
        const pipeline = await Pipeline.create({ name, type, workspaceId, realtorId });
        res.status(201).json(pipeline);
    } catch (error) {
        res.status(500).json({ message: "Failed to create pipeline", error });
    }
}

export const getPipelines = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = getPipelinesSchema.parse(req.params);
        const realtorId = (req as AuthenticatedRequest).user.id;
        const pipelines = await Pipeline.find({ workspaceId, realtorId });
        res.status(200).json(pipelines);
    } catch (error) {
        res.status(500).json({ message: "Failed to get pipelines", error });
    }
}

export const getPipelineDetails = async (req: Request, res: Response) => {
    try {
        const { id } = getPipelineDetailsSchema.parse(req.params);
        const pipeline = await Pipeline.findById(id);
        res.status(200).json(pipeline);
    } catch (error) {
        res.status(500).json({ message: "Failed to get pipeline details", error });
    }
}

export const updatePipeline = async (req: Request, res: Response) => {
    try {
        const { id } = getPipelineDetailsSchema.parse(req.params);
        const { name, type } = updatePipelineSchema.parse(req.body);
        const pipeline = await Pipeline.findByIdAndUpdate(id, { name, type }, { new: true });
        res.status(200).json(pipeline);
    } catch (error) {
        res.status(500).json({ message: "Failed to update pipeline", error });
    }
}

export const deletePipeline = async (req: Request, res: Response) => {
    try {
        const { id } = getPipelineDetailsSchema.parse(req.params);
        const pipeline = await Pipeline.findByIdAndDelete(id);
        res.status(200).json(pipeline);
    } catch (error) {
        res.status(500).json({ message: "Failed to delete pipeline", error });
    }
}