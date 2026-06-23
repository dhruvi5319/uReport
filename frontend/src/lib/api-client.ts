import { type ApiResponse } from '@/types/api';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: ApiResponse<never>['errors'] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base URL for API calls.
 * - Client-side: relative path (Next.js rewrites handle proxying in dev)
 * - Server-side SSR: must be absolute (PHP_API_BASE_URL)
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client: use relative path — rewrite proxy handles /api/* and /auth/*
    return '';
  }
  // Server: absolute URL to PHP backend
  return process.env.PHP_API_BASE_URL ?? 'http://localhost:8080';
}

/**
 * Typed fetch wrapper for the PHP JSON API.
 * Parses { data, meta, errors } envelope.
 * Throws ApiError on non-2xx responses.
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${getBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send ureport_session cookie
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, 'PARSE_ERROR', 'Invalid JSON response from API');
  }

  if (!res.ok) {
    const firstError = json.errors?.[0];
    throw new ApiError(
      res.status,
      firstError?.code ?? 'API_ERROR',
      firstError?.message ?? `HTTP ${res.status}`,
      json.errors
    );
  }

  return json;
}

export { ApiError };
