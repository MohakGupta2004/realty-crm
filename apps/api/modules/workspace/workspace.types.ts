import { z } from "zod";

export const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required"),
    domain: z.string().min(1, "Domain is required"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
