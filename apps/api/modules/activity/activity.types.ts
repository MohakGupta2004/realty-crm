import type { Document, Types } from "mongoose";

export enum ActivityType {
    LEAD_CREATED = "LEAD_CREATED",
    LEAD_UPDATED = "LEAD_UPDATED",
    EMAIL_SENT = "EMAIL_SENT",
    NOTE_ADDED = "NOTE_ADDED",
    TASK_ADDED = "TASK_ADDED",
    TASK_COMPLETED = "TASK_COMPLETED",
    STATUS_CHANGED = "STATUS_CHANGED",
    STAGE_CHANGED = "STAGE_CHANGED",
    EMAIL_RECEIVED = "EMAIL_RECEIVED",
}

export interface IActivity {
    _id: Types.ObjectId;
    leadId: Types.ObjectId;
    realtorId: Types.ObjectId;
    type: ActivityType;
    content: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface IActivityCreate {
    leadId: string;
    realtorId: string;
    type: ActivityType;
    content: string;
    metadata?: any;
}
