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

export default function AIProvidersList({ data }: { data: LLMProvider[] }) {
  const [providers, setProviders] = useState<LLMProvider[]>(data);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', baseUrl: '', apiKey: '', tier: 'production' as string });
  const [submitting, setSubmitting] = useState(false);

  const fetchProviders = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/ai/providers`);
    const json = await res.json();
    setProviders(json.data || []);
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
        setForm({ name: '', displayName: '', baseUrl: '', apiKey: '', tier: 'production' });
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
    }
  }, []);

  const columns: ColumnDef<LLMProvider>[] = [
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
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
      </div>
      <DataTable columns={columns} data={providers} emptyTitle="No Providers" emptyDescription="Add your first LLM provider." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Provider</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name (unique ID)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. openai, deepseek" /></div>
            <div><Label>Display Name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="OpenAI" /></div>
            <div><Label>Base URL</Label><Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></div>
            <div><Label>API Key</Label><Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." /></div>
            <div><Label>Tier</Label><Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}><option value="production">Production</option><option value="development">Development</option><option value="testing">Testing</option></Select></div>
            <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.baseUrl || !form.apiKey}>
              {submitting ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
