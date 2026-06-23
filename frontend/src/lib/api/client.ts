// Wave 3a API client — base fetch wrapper with cookie-based session auth
// Handles the { data, meta, errors } envelope returned by all PHP API endpoints

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');

export interface ApiEnvelope<T = unknown> {
  data: T;
  meta: Record<string, unknown>;
  errors: Array<{ field: string | null; message: string; code: string | null }>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: ApiEnvelope['errors'] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const body = isJson ? await res.json() : { data: null, meta: {}, errors: [] };
    const msg =
      (body as ApiEnvelope).errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, (body as ApiEnvelope).errors);
  }

  if (!isJson) {
    // CSV / file download — return empty envelope; caller ignores body
    return { data: null as T, meta: {}, errors: [] };
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  return json;
}
