export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: string) {
    super(message, 404, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string) {
    super(message, 409, code);
  }
}

export class ShopifyApiError extends AppError {
  constructor(message: string) {
    super(message, 502, 'SHOPIFY_API_ERROR');
  }
}
