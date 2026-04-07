import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const addMembersSchema = z.object({
    workspaceId: objectIdSchema,
    users: z.array(z.string().email()).min(1, "At least one user email is required"),
});

export const updateMemberSchema = z.object({
    role: z.enum(["OWNER", "AGENT"]).optional(),
    isAccepted: z.boolean().optional(),
});

export const membershipIdParamSchema = z.object({
    id: objectIdSchema,
});

export const tokenParamSchema = z.object({
    token: z.string().min(1),
});

export const workspaceIdParamSchema = z.object({
    workspaceId: objectIdSchema,
});
