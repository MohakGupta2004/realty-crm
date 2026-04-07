import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.string().optional().default("TODO"),
  body: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: objectIdSchema.optional(),
  relations: z.array(objectIdSchema).optional(),
  workspaceId: objectIdSchema,
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  status: z.string().optional(),
  body: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: objectIdSchema.optional(),
  relations: z.array(objectIdSchema).optional(),
});

export const taskIdParamSchema = z.object({
  id: objectIdSchema,
});

export const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

export const leadAndWorkspaceIdParamSchema = z.object({
  leadId: objectIdSchema,
  workspaceId: objectIdSchema,
});
