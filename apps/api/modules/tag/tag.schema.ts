import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
  type: z.enum(["MANUAL", "DYNAMIC"]).optional(),
  filters: z.any().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").optional(),
  color: z.string().optional(),
  type: z.enum(["MANUAL", "DYNAMIC"]).optional(),
  filters: z.any().optional(),
});
