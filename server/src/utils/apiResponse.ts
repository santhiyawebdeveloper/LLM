import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    message?: string;
    status?: number;
    pagination?: PaginationMeta;
  }
): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (options?.message) body.message = options.message;
  if (options?.pagination) body.pagination = options.pagination;

  res.status(options?.status ?? 200).json(body);
}

export function sendError(
  res: Response,
  message: string,
  code: string,
  status: number,
  errors?: Record<string, string[]>
): void {
  const body: ApiErrorResponse = {
    success: false,
    message,
    code,
  };

  if (errors) body.errors = errors;

  res.status(status).json(body);
}

export function parsePagination(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}
