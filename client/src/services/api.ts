import type { ApiError, ApiResponse } from '../types/enrollment';

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

async function getAuthHeaders(): Promise<HeadersInit> {
  const shopify = (window as unknown as { shopify?: { idToken: () => Promise<string> } }).shopify;
  if (shopify?.idToken) {
    const token = await shopify.idToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiClientError(
      response.status === 401 ? 'Authentication required' : 'Request failed',
      response.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR',
      response.status
    );
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiError;
    throw new ApiClientError(
      error.message || 'Request failed',
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
