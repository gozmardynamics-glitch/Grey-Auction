const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function getAgentDashboard() { const r = await fetch(`${API_URL}/admin/agents/dashboard`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentInstances() { const r = await fetch(`${API_URL}/admin/agents/instances`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentInstance(id: string) { const r = await fetch(`${API_URL}/admin/agents/instances/${id}`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentTools() { const r = await fetch(`${API_URL}/admin/agents/tools`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentTool(id: string) { const r = await fetch(`${API_URL}/admin/agents/tools/${id}`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentWorkflows() { const r = await fetch(`${API_URL}/admin/agents/workflows`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentWorkflow(id: string) { const r = await fetch(`${API_URL}/admin/agents/workflows/${id}`, { cache: 'no-store' }); return (await r.json()).data; }
export async function getAgentMetrics(agentId?: string) { const q = agentId ? `?agentId=${agentId}` : ''; const r = await fetch(`${API_URL}/admin/agents/metrics${q}`, { cache: 'no-store' }); return (await r.json()).data; }
export async function runGapAnalysis() { const r = await fetch(`${API_URL}/admin/agents/analyze`, { method: 'POST', cache: 'no-store' }); return (await r.json()).data; }
export async function discoverCapabilities() { const r = await fetch(`${API_URL}/admin/agents/discover`, { method: 'POST', cache: 'no-store' }); return (await r.json()).data; }
