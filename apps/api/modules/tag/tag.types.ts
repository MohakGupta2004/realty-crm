import mongoose, { Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  type: "MANUAL" | "DYNAMIC";
  filters: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagCreate {
  name: string;
  color?: string;
  userId: string;
  workspaceId: string;
  type?: "MANUAL" | "DYNAMIC";
  filters?: any;
}

export interface ITagUpdate {
  name?: string;
  color?: string;
  type?: "MANUAL" | "DYNAMIC";
  filters?: any;
}
