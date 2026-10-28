'use client';

/**
 * Step-up re-authentication, as a browser-side signal.
 *
 * Consequential admin actions (escrow refunds, wallet credits, suspensions,
 * admin management, MFA policy) need a second-factor proof that is no more than
 * a few minutes old. The API answers `403 { code: 'STEP_UP_REQUIRED' }` when it
 * is not, and this module turns that into one prompt instead of every screen
 * inventing its own dialog.
 *
 * `apiFetch` emits when it sees the code; `<StepUpHost />` is mounted once in
 * the admin layout and handles it.
 */

export const STEP_UP_EVENT = 'greyauction:step-up-required';

export interface StepUpDetail {
  windowMinutes?: number;
}

/** Called from the API client. Safe in a non-browser context (no-op). */
export function emitStepUpRequired(detail: StepUpDetail = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<StepUpDetail>(STEP_UP_EVENT, { detail }));
}

export function onStepUpRequired(handler: (detail: StepUpDetail) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => handler((event as CustomEvent<StepUpDetail>).detail ?? {});
  window.addEventListener(STEP_UP_EVENT, listener);
  return () => window.removeEventListener(STEP_UP_EVENT, listener);
}

/** True when an error is the API asking for a fresh second factor. */
export function isStepUpRequired(body: unknown): boolean {
  return Boolean(body && typeof body === 'object' && (body as { code?: string }).code === 'STEP_UP_REQUIRED');
}
