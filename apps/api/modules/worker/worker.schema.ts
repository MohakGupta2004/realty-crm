import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const sendMailSchema = z.object({
    batchId: objectIdSchema,
});
