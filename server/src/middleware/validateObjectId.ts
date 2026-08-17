import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from '../utils/apiResponse.js';
import { AppError } from '../utils/errors.js';

export function validateObjectIdParam(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = req.params[paramName];
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !isValidObjectId(value)) {
      next(new AppError('Invalid ID format', 400, 'INVALID_ID'));
      return;
    }

    next();
  };
}
