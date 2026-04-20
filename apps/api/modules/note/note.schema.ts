import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().optional(),
  relations: z.array(objectIdSchema).optional(),
  workspaceId: objectIdSchema,
});

export const updateNoteSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  relations: z.array(objectIdSchema).optional(),
});

export const noteIdParamSchema = z.object({
  id: objectIdSchema,
});

export const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

export const leadIdParamSchema = z.object({
  leadId: objectIdSchema,
});
