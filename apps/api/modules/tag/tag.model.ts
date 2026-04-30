import mongoose from "mongoose";
import type { ITag } from "./tag.types";

const tagSchema = new mongoose.Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    type: {
      type: String,
      enum: ["MANUAL", "DYNAMIC"],
      default: "MANUAL",
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

tagSchema.index({ workspaceId: 1, userId: 1, name: 1 }, { unique: true });

export const Tag = mongoose.model<ITag>("Tag", tagSchema);
