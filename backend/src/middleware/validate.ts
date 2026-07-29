import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * validate — Zod request validation middleware.
 * Validates req[target] against the provided schema.
 * Returns 400 with field-level errors on failure.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: errors,
        requestId: req.requestId,
      });
      return;
    }

    // Replace target with parsed (coerced/sanitized) data
    (req as any)[target] = result.data;
    next();
  };
}
