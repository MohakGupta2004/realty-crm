import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required"),
});

export const updateWorkspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required").optional(),
});

export const workspaceIdParamSchema = z.object({
    id: objectIdSchema,
});
