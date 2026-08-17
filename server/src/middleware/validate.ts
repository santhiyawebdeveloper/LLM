import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';
import { formatZodErrors } from '../validators/index.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as Request['query'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
}
