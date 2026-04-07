import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

interface ValidationSchema {
  body?: ZodObject;
  query?: ZodObject;
  params?: ZodObject;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query) as any;
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params) as any;
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.flatten(),
        });
      }
      return res.status(500).json({ message: "Internal server error during validation" });
    }
  };
};
