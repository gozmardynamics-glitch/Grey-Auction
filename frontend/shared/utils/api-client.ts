/**
 * One authenticated fetch helper for every client-side API call.
 *
 * Replaces the ad-hoc `fetch(apiBase + path)` pattern that (a) forgot the
 * Authorization header on money screens, (b) left demo-data fallbacks in the
 * catch branch, and (c) threw generic "Failed to load" errors that hid the
 * real status code.
 *
 * Usage:
 *   const json = await apiFetch<{ data: Invoice[] }>('invoices', { token });
 *   const page = await apiFetch('products', { query: { page: 2, category } });
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Base URL for API calls.
 *
 * In the browser this is the same-origin BFF proxy: the backend JWT never
 * reaches client JavaScript, the proxy attaches it from the HTTP-only session
 * cookie (5.6). Server-side callers keep talking to the backend directly.
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
  }
  return process.env.API_URL || 'http://localhost:3001/api';
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Bearer token from the auth session; omitted for public endpoints. */
  token?: string | null;
  /** JSON-serializable request body. */
  body?: unknown;
  /** Query params; undefined/null values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const base = getApiBase();
  let url = `${base}/${path.replace(/^\//, '')}`;
  if (opts.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
      signal: opts.signal,
    });
  } catch (err) {
    // Network failure / DNS / CORS — distinguishable from a 4xx/5xx.
    throw new ApiError(0, 'Network error — API unreachable', err);
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const body = (payload ?? {}) as { message?: unknown; error?: unknown };
    const raw = body.message ?? body.error;
    const message = Array.isArray(raw)
      ? raw.join('; ')
      : raw
        ? String(raw)
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}
