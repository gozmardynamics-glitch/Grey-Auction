const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function getAIProviders() {
  const res = await fetch(`${API_URL}/admin/ai/providers`, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export async function getAIProvider(id: string) {
  const res = await fetch(`${API_URL}/admin/ai/providers/${id}`, { cache: 'no-store' });
  const json = await res.json();
  return json.data;
}

export async function getProviderModels(providerId: string) {
  const res = await fetch(`${API_URL}/admin/ai/providers/${providerId}/models`, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export async function getAIFeatures() {
  const res = await fetch(`${API_URL}/admin/ai/features`, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export async function getAIFeature(id: string) {
  const res = await fetch(`${API_URL}/admin/ai/features/${id}`, { cache: 'no-store' });
  const json = await res.json();
  return json.data;
}

export async function getAIUsageSummary() {
  const res = await fetch(`${API_URL}/admin/ai/usage/summary`, { cache: 'no-store' });
  const json = await res.json();
  return json.data || { totalTokens: 0, totalCost: 0, byProvider: {} };
}

export async function getAllModels() {
  const providers = await getAIProviders();
  const models: any[] = [];
  for (const p of providers) {
    for (const m of (p.models || [])) {
      models.push({ ...m, provider: p });
    }
  }
  return models;
}
