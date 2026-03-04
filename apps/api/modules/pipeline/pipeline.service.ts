import { Pipeline } from "./pipeline.model";


export class PipelineService {
    async createPipeline(name: string, type: string, workspaceId: string, realtorId: string) {
        const pipeline = await Pipeline.create({ name, type, workspaceId, realtorId });
        return pipeline;
    }

    async getPipelines(workspaceId: string, realtorId: string) {
        const pipelines = await Pipeline.find({ workspaceId, realtorId });
        return pipelines;
    }

    async getPipelineDetails(id: string) {
        const pipeline = await Pipeline.findById(id);
        return pipeline;
    }

    async updatePipeline(id: string, name: string, type: string) {
        const pipeline = await Pipeline.findByIdAndUpdate(id, { name, type }, { new: true });
        return pipeline;
    }

    async deletePipeline(id: string) {
        const pipeline = await Pipeline.findByIdAndDelete(id);
        return pipeline;
    }
}