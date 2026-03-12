import mongoose from "mongoose";
import { ActivityType, type IActivity } from "./activity.types";

const activitySchema = new mongoose.Schema<IActivity>({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        required: true
    },
    realtorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: Object.values(ActivityType),
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

activitySchema.index({ leadId: 1, createdAt: -1 });
activitySchema.index({ realtorId: 1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
