import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateRequest = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction):void => {
    try {
      req.body = schema.parse(req.body); 
      next();
    } catch (error) {
      if (error instanceof ZodError) {
         res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
