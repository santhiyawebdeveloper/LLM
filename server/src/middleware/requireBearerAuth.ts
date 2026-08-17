import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export function requireBearerAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer .+/.test(authHeader)) {
    sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
    return;
  }
  next();
}
