// Admin agents endpoints are JwtAuthGuard + AdminRolesGuard protected, so
// every call must carry the session token — the token-less fetches all 401'd
// and the dashboard silently rendered empty panels.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Headers_ = { cache: 'no-store'; headers: Record<string, string> };

function headers(token?: string | null): Headers_ {
  return {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

export async function getAgentDashboard(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/dashboard`, headers(token)); return (await r.json()).data; }
export async function getAgentInstances(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/instances`, headers(token)); return (await r.json()).data; }
export async function getAgentInstance(id: string, token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/instances/${id}`, headers(token)); return (await r.json()).data; }
export async function getAgentTools(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/tools`, headers(token)); return (await r.json()).data; }
export async function getAgentTool(id: string, token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/tools/${id}`, headers(token)); return (await r.json()).data; }
export async function getAgentWorkflows(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/workflows`, headers(token)); return (await r.json()).data; }
export async function getAgentWorkflow(id: string, token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/workflows/${id}`, headers(token)); return (await r.json()).data; }
export async function getAgentMetrics(agentId?: string, token?: string | null) { const q = agentId ? `?agentId=${agentId}` : ''; const r = await fetch(`${API_URL}/admin/agents/metrics${q}`, headers(token)); return (await r.json()).data; }
export async function runGapAnalysis(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/analyze`, { ...headers(token), method: 'POST' }); return (await r.json()).data; }
export async function discoverCapabilities(token?: string | null) { const r = await fetch(`${API_URL}/admin/agents/discover`, { ...headers(token), method: 'POST' }); return (await r.json()).data; }
