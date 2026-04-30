import mongoose from "mongoose";

// this store which leads will receive which step.

const campaignBatchSchema = new mongoose.Schema({

    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaing"
    },

    stepId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CampaignStep"
    },

    leads: [{
        leadId: { type: mongoose.Schema.Types.ObjectId, required: true },
        email: { type: String, required: true },
        name: { type: String, required: true },
        messageId: { type: String },
        openedAt: { type: Date },
        openCount: { type: Number, default: 0 }
    }],

    runAt: Date,

    status: {
        type: String,
        enum: ["pending", "queued", "processing", "sent", "failed", "paused"],
        default: "pending"
    }

});

campaignBatchSchema.index({
    status: 1,
    runAt: 1
});

campaignBatchSchema.index({ campaignId: 1, stepId: 1 });

/*

stepId → tells worker which email to send
runAt → when to send it

*/

export const CampaignBatch = mongoose.model("CampaignBatch", campaignBatchSchema);