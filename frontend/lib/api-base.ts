/**
 * Where the frontend talks to the backend.
 *
 * Two different bases on purpose (5.6):
 *
 *  - `SERVER_API_BASE` — absolute backend URL, used by server components, the
 *    Auth.js callbacks and the proxy route handler. The backend bearer token
 *    only ever exists on this side.
 *  - `BROWSER_API_BASE` — the same-origin BFF proxy. Browser code never holds
 *    the token; `/api/proxy/*` reads it from the HTTP-only session cookie.
 *
 * Set `NEXT_PUBLIC_API_URL=/api/proxy` so every browser fetch (including the
 * legacy raw `fetch()` call sites) goes through the proxy, and point
 * `API_URL` at the real backend for server-side use.
 */
export const SERVER_API_BASE =
  process.env.API_URL || 'http://localhost:3001/api';

export const BROWSER_API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
