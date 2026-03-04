import mongoose from "mongoose";
import type { IPipeline } from "./pipeline.types";

const pipelineSchema = new mongoose.Schema<IPipeline>({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["BUYER", "SELLER"],
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    realtorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true,
});

pipelineSchema.index({ workspaceId: 1, realtorId: 1 });

export const Pipeline = mongoose.model<IPipeline>("Pipeline", pipelineSchema);