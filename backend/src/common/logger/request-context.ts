import { AsyncLocalStorage } from 'async_hooks';

/**
 * G50 — per-request logging context.
 *
 * RequestIdMiddleware opens a store per HTTP request; the structured logger
 * reads it so every log line carries the X-Request-Id that clients see in
 * error envelopes — no manual requestId plumbing through services.
 */
export interface RequestLogContext {
  requestId: string;
  method?: string;
  url?: string;
}

export const requestLogContext = new AsyncLocalStorage<RequestLogContext>();

export function getRequestId(): string | undefined {
  return requestLogContext.getStore()?.requestId;
}
