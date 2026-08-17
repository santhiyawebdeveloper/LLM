import { Request, Response, NextFunction } from 'express';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/apiResponse.js';
import { isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { formatZodErrors } from '../validators/index.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Route not found', 'NOT_FOUND', 404);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Request error', {
    name: err.name,
    message: err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });

  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.errors);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422, formatZodErrors(err));
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    const keyPattern = err.keyPattern as Record<string, unknown> | undefined;

    if (keyPattern?.storeId && keyPattern?.studentId && keyPattern?.courseId) {
      sendError(
        res,
        'Student is already enrolled in this course',
        'DUPLICATE_ENROLLMENT',
        409
      );
      return;
    }

    if (keyPattern?.storeId && keyPattern?.email) {
      sendError(
        res,
        'A student with this email already exists',
        'DUPLICATE_STUDENT',
        409
      );
      return;
    }

    sendError(res, 'Duplicate record', 'DUPLICATE_KEY', 409);
    return;
  }

  if (err.name === 'CastError') {
    sendError(res, 'Invalid ID format', 'INVALID_ID', 400);
    return;
  }

  sendError(
    res,
    isProduction ? 'Internal server error' : err.message,
    'INTERNAL_ERROR',
    500
  );
}
