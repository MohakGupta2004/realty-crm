import { Schema, model, Document, Types } from "mongoose";

export interface IEmailHistory extends Document {
    leadId: Types.ObjectId;
    realtorId: Types.ObjectId;
    subject: string;
    body: string;
    senderEmail: string;
    messageId: string;
    receivedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const emailHistorySchema = new Schema<IEmailHistory>(
    {
        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
            required: true,
        },
        realtorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subject: {
            type: String,
        },
        body: {
            type: String,
        },
        senderEmail: {
            type: String,
            required: true,
        },
        messageId: {
            type: String,
            required: true,
            unique: true,
        },
        receivedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

emailHistorySchema.index({ leadId: 1 });
emailHistorySchema.index({ realtorId: 1 });
emailHistorySchema.index({ messageId: 1 });

export const EmailHistory = model<IEmailHistory>("EmailHistory", emailHistorySchema);
