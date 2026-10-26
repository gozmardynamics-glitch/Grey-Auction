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

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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

  let payload: any = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' &&
        (payload.message || payload.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join('; ') : String(message), payload);
  }

  return payload as T;
}
