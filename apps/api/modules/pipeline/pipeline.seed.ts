import { Pipeline } from "./pipeline.model";
import { PipelineStage } from "../pipelineStage/pipelineStage.model";

const BUYER_STAGES = [
    { name: "New Inquiry", description: "Lead has just come in", probability: 10 },
    { name: "Contacted", description: "Initial contact has been made", probability: 20 },
    { name: "Qualified", description: "Lead is qualified and ready to proceed", probability: 30 },
    { name: "Active Search", description: "Actively searching for properties", probability: 40 },
    { name: "Showing Scheduled", description: "Property showings have been scheduled", probability: 50 },
    { name: "Offer Submitted", description: "An offer has been submitted", probability: 70 },
    { name: "Under Contract", description: "Deal is under contract", probability: 90 },
    { name: "Closed Won", description: "Deal has been closed successfully", probability: 100, isFinal: true },
    { name: "Lost", description: "Lead was lost", probability: 0, isFinal: true },
];

const SELLER_STAGES = [
    { name: "New Listing", description: "New listing inquiry received", probability: 10 },
    { name: "Listed", description: "Property has been listed", probability: 30 },
    { name: "Showing", description: "Showings are taking place", probability: 40 },
    { name: "Offer Received", description: "An offer has been received", probability: 60 },
    { name: "Under Contract", description: "Deal is under contract", probability: 90 },
    { name: "Closed", description: "Deal has been closed successfully", probability: 100, isFinal: true },
    { name: "Lost", description: "Listing was lost", probability: 0, isFinal: true },
];

/**
 * Ensures default BUYER and SELLER pipelines exist for a workspace.
 * If they don't exist, creates them along with their default stages.
 * Returns the pipeline IDs and the first stage ID for each pipeline.
 */
export async function ensureDefaultPipelines(workspaceId: string, realtorId: string) {
    let buyerPipeline = await Pipeline.findOne({ workspaceId, type: "BUYER" });
    let sellerPipeline = await Pipeline.findOne({ workspaceId, type: "SELLER" });

    if (!buyerPipeline) {
        buyerPipeline = await Pipeline.create({
            name: "Buyer Pipeline",
            type: "BUYER",
            workspaceId,
            realtorId,
        });
        await PipelineStage.insertMany(
            BUYER_STAGES.map((stage, index) => ({
                ...stage,
                pipelineId: buyerPipeline!._id,
                workspaceId,
                stageNumber: index + 1,
                isFinal: stage.isFinal ?? false,
            }))
        );
    }

    if (!sellerPipeline) {
        sellerPipeline = await Pipeline.create({
            name: "Seller Pipeline",
            type: "SELLER",
            workspaceId,
            realtorId,
        });
        await PipelineStage.insertMany(
            SELLER_STAGES.map((stage, index) => ({
                ...stage,
                pipelineId: sellerPipeline!._id,
                workspaceId,
                stageNumber: index + 1,
                isFinal: stage.isFinal ?? false,
            }))
        );
    }

    // Get the first stage of each pipeline
    const buyerFirstStage = await PipelineStage.findOne({ pipelineId: buyerPipeline._id }).sort({ stageNumber: 1 });
    const sellerFirstStage = await PipelineStage.findOne({ pipelineId: sellerPipeline._id }).sort({ stageNumber: 1 });

    return {
        buyer: { pipelineId: buyerPipeline._id, firstStageId: buyerFirstStage?._id },
        seller: { pipelineId: sellerPipeline._id, firstStageId: sellerFirstStage?._id },
    };
}
