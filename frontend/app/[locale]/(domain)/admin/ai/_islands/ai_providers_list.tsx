'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/shared/components/common/data_table';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/common/dialog';
import { Input } from '@/shared/components/common/input';
import { Select } from '@/shared/components/common/select';
import { Label } from '@/shared/components/common/label';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, Edit, Wifi } from 'lucide-react';
import type { LLMProvider } from '../../models';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type HealthStatus = 'unknown' | 'healthy' | 'degraded' | 'down';

type ProviderWithHealth = LLMProvider & {
  status?: HealthStatus;
  lastCheckedAt?: string | null;
  lastLatencyMs?: number | null;
  consecutiveFailures?: number;
};

type ProviderPreset = {
  name: string;
  displayName: string;
  baseUrl: string;
  docs: string;
  tier: string;
  providerType?: 'openai' | 'anthropic' | 'gemini';
};

const STATUS_META: Record<HealthStatus, { color: string; label: string }> = {
  unknown: { color: '#9ca3af', label: 'Unknown' },
  healthy: { color: '#22c55e', label: 'Healthy' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
  down: { color: '#ef4444', label: 'Down' },
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function AIProvidersList({ data }: { data: LLMProvider[] }) {
  const [providers, setProviders] = useState<ProviderWithHealth[]>(data);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    baseUrl: '',
    apiKey: '',
    tier: 'production' as string,
    providerType: 'openai' as 'openai' | 'anthropic' | 'gemini',
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);

  const fetchProviders = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/ai/providers`);
    const json = await res.json();
    setProviders(json.data || []);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/admin/ai/providers/presets`)
      .then((res) => res.json())
      .then((json) => setPresets(json.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/ai/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Provider created');
        setOpen(false);
        setForm({ name: '', displayName: '', baseUrl: '', apiKey: '', tier: 'production', providerType: 'openai' });
        await fetchProviders();
      } else {
        toast.error('Failed to create provider');
      }
    } catch {
      toast.error('Failed to create provider');
    } finally {
      setSubmitting(false);
    }
  }, [form, fetchProviders]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/ai/providers/${id}`, { method: 'DELETE' });
      toast.success('Provider deleted');
      await fetchProviders();
    } catch {
      toast.error('Failed to delete provider');
    }
  }, [fetchProviders]);

  const handleHealthCheck = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/ai/providers/${id}/health`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Connected! ${json.data?.modelCount || 0} models found`);
      } else {
        toast.error(json.message || 'Connection failed');
      }
    } catch {
      toast.error('Health check failed');
    } finally {
      await fetchProviders();
    }
  }, [fetchProviders]);

  const handleCheckAll = useCallback(async () => {
    setCheckingAll(true);
    try {
      const results = await Promise.allSettled(
        providers.map((p) => fetch(`${API_URL}/admin/ai/providers/${p.id}/health`, { method: 'POST' })),
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(`Checked ${ok}/${providers.length} providers`);
    } catch {
      toast.error('Health check failed');
    } finally {
      setCheckingAll(false);
      await fetchProviders();
    }
  }, [providers, fetchProviders]);

  const handlePresetSelect = useCallback((value: string) => {
    const preset = presets.find((p) => p.name === value);
    if (!preset) return;
    setForm({
      name: preset.name,
      displayName: preset.displayName,
      baseUrl: preset.baseUrl,
      apiKey: '',
      tier: preset.tier,
      providerType: preset.providerType || 'openai',
    });
  }, [presets]);

  const columns: ColumnDef<ProviderWithHealth>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'displayName',
      header: 'Display Name',
      cell: ({ row }) => (
        <Link href={`/admin/ai/providers/${row.original.id}`} className="text-primary hover:underline font-medium">
          {row.original.displayName}
        </Link>
      ),
    },
    {
      accessorKey: 'models',
      header: 'Models',
      cell: ({ row }) => <Badge variant="outline">{row.original.models?.length || 0}</Badge>,
    },
    {
      id: 'health',
      header: 'Health',
      cell: ({ row }) => {
        const status = row.original.status || 'unknown';
        const meta = STATUS_META[status];
        const latency = row.original.lastLatencyMs;
        const checkedAt = row.original.lastCheckedAt;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-xs font-medium">{meta.label}</span>
            </span>
            {(latency != null || checkedAt) && (
              <span className="text-xs text-muted-foreground">
                {latency != null ? `${latency}ms` : ''}
                {latency != null && checkedAt ? ' · ' : ''}
                {checkedAt ? formatRelativeTime(checkedAt) : ''}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { accessorKey: 'tier', header: 'Tier' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleHealthCheck(row.original.id)} title="Health check">
            <Wifi className="h-4 w-4" />
          </Button>
          <Link href={`/admin/ai/providers/${row.original.id}`}>
            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Providers</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckAll} disabled={checkingAll || providers.length === 0}>
            {checkingAll ? 'Checking...' : 'Check All'}
          </Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
        </div>
      </div>
      <DataTable columns={columns} data={providers} emptyTitle="No Providers" emptyDescription="Add your first LLM provider." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Provider</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Add from preset</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value=""
                onChange={(e) => handlePresetSelect(e.target.value)}
              >
                <option value="">Choose a provider preset...</option>
                {presets.map((p) => (
                  <option key={p.name} value={p.name}>{p.displayName}</option>
                ))}
              </select>
            </div>
            <div><Label>Name (unique ID)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. openai, deepseek" /></div>
            <div><Label>Display Name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="OpenAI" /></div>
            <div><Label>Base URL</Label><Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></div>
            <div><Label>API Key</Label><Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." /></div>
            <div><Label>Tier</Label><Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}><option value="production">Production</option><option value="development">Development</option><option value="testing">Testing</option></Select></div>
            <div><Label>Protocol</Label><Select value={form.providerType} onValueChange={(v) => setForm({ ...form, providerType: v as 'openai' | 'anthropic' | 'gemini' })}><option value="openai">OpenAI-compatible (Bearers)</option><option value="anthropic">Anthropic (x-api-key)</option><option value="gemini">Google Gemini (key param)</option></Select></div>
            <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.baseUrl || !form.apiKey}>
              {submitting ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
