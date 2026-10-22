import type {
  AIFeatureConfig,
  LLMModel,
  LLMProvider,
} from '../../models';
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
async function apiGet<T>(path: string, fallback: T): Promise<T> {
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
    const json = (await res.json()) as { data?: T };
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export interface AIUsageSummary {
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
}

export async function getAIProviders(): Promise<LLMProvider[]> {
  return apiGet<LLMProvider[]>('/admin/ai/providers', []);
}

export async function getAIProvider(id: string): Promise<LLMProvider | undefined> {
  return apiGet<LLMProvider | undefined>(`/admin/ai/providers/${id}`, undefined);
}

export async function getProviderModels(providerId: string): Promise<LLMModel[]> {
  return apiGet<LLMModel[]>(`/admin/ai/providers/${providerId}/models`, []);
}

export async function getAIFeatures(): Promise<AIFeatureConfig[]> {
  return apiGet<AIFeatureConfig[]>('/admin/ai/features', []);
}

export async function getAIFeature(id: string): Promise<AIFeatureConfig | undefined> {
  return apiGet<AIFeatureConfig | undefined>(`/admin/ai/features/${id}`, undefined);
}

export async function getAIUsageSummary(): Promise<AIUsageSummary> {
  return apiGet<AIUsageSummary>('/admin/ai/usage/summary', {
    totalTokens: 0,
    totalCost: 0,
    byProvider: {},
  });
}

export async function getAllModels(): Promise<LLMModel[]> {
  const providers = await getAIProviders();
  const models: LLMModel[] = [];
  for (const p of providers) {
    for (const m of p.models ?? []) {
      models.push({ ...m, provider: p });
    }
  }
  return models;
}
