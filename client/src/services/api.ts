import type { ApiError, ApiResponse } from '../types/enrollment';
import { isShopifyEmbedded } from '../utils/shopifyContext';

const SESSION_TOKEN_TIMEOUT_MS = 15_000;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function getUnauthorizedMessage(): string {
  if (isShopifyEmbedded()) {
    return 'Your Shopify session has expired. Please reopen the app from Shopify Admin (Apps → LMS).';
  }
  return 'Open this app from Shopify Admin (Apps → LMS) to load data.';
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const shopify = (window as unknown as { shopify?: { idToken: () => Promise<string> } }).shopify;
  if (shopify?.idToken) {
    const token = await Promise.race<string | null>([
      shopify.idToken().catch(() => null),
      new Promise((resolve) => {
        setTimeout(() => resolve(null), SESSION_TOKEN_TIMEOUT_MS);
      }),
    ]);

    if (!token) {
      throw new ApiClientError(
        getUnauthorizedMessage(),
        'UNAUTHORIZED',
        401
      );
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}

function withEmbeddedContext(endpoint: string): string {
  const [path, existingQuery = ''] = endpoint.split('?');
  const params = new URLSearchParams(existingQuery);
  const current = new URLSearchParams(window.location.search);

  for (const key of ['shop', 'host'] as const) {
    const value = current.get(key);
    if (value && !params.has(key)) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders();

  const response = await fetch(withEmbeddedContext(`/api${endpoint}`), {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const reauthorize = response.headers.get('X-Shopify-API-Request-Failure-Reauthorize');
    throw new ApiClientError(
      reauthorize || response.status === 401 || response.status === 403
        ? getUnauthorizedMessage()
        : 'Request failed',
      'UNAUTHORIZED',
      response.status === 403 ? 401 : response.status
    );
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiError;
    const message =
      response.status === 401
        ? getUnauthorizedMessage()
        : error.message || 'Request failed';
    throw new ApiClientError(
      message,
      error.code || 'UNKNOWN_ERROR',
      response.status,
      error.errors
    );
  }

  return data as ApiResponse<T>;
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return fallback;
}
