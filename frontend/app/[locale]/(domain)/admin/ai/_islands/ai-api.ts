import type { LLMModel } from '../../models';
import { auth } from '@/auth';
import { cache } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Per-request session token — cached with React cache() so a page render
 * performs at most one auth() decode (no cross-request leakage).
 *
 * This module is imported ONLY by server components (admin/ai pages), so the
 * Auth.js session is available at fetch time. Server-side fetches forward the
 * admin JWT, letting JWT-guarded endpoints (JwtAuthGuard + AdminRolesGuard on
 * the backend /admin/ai controller) return real data on first paint instead
 * of an empty grid that only refills after a client round-trip.
 */
const getSessionToken = cache(async (): Promise<string | null> => {
  try {
    const session = await auth();
    return session?.user?.accessToken || null;
  } catch {
    return null;
  }
});

/** Server-side GET with the Auth.js session token attached when present. */
async function apiGet(path: string, fallback: unknown): Promise<any> {
  try {
    const token = await getSessionToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getAIProviders() {
  return apiGet('/admin/ai/providers', []);
}

export async function getAIProvider(id: string) {
  return apiGet(`/admin/ai/providers/${id}`, undefined);
}

export async function getProviderModels(providerId: string) {
  return apiGet(`/admin/ai/providers/${providerId}/models`, []);
}

export async function getAIFeatures() {
  return apiGet('/admin/ai/features', []);
}

export async function getAIFeature(id: string) {
  return apiGet(`/admin/ai/features/${id}`, undefined);
}

export async function getAIUsageSummary() {
  return apiGet('/admin/ai/usage/summary', {
    totalTokens: 0,
    totalCost: 0,
    byProvider: {},
  });
}

export async function getAllModels() {
  const providers = await getAIProviders();
  const models: Record<string, unknown>[] = [];
  for (const p of providers) {
    for (const m of (p.models || [])) {
      models.push({ ...m, provider: p });
    }
  }
  // Runtime shape is LLMModel + provider; assert at the boundary.
  return models as unknown as LLMModel[];
}
