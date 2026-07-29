'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/shared/components/common/button';
import { Input } from '@/shared/components/common/input';
import { Label } from '@/shared/components/common/label';
import { Select } from '@/shared/components/common/select';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import Link from 'next/link';
import type { LLMProvider } from '../../models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AIProviderForm({ provider }: { provider: LLMProvider }) {
  const [form, setForm] = useState<{
    displayName: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    tier: string;
    isActive: boolean;
  }>({
    displayName: provider.displayName,
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    tier: provider.tier,
    isActive: provider.isActive,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ai/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Provider updated');
      } else {
        toast.error('Failed to update provider');
      }
    } catch {
      toast.error('Failed to update provider');
    } finally {
      setSaving(false);
    }
  }, [form, provider.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Provider: {provider.displayName}</h2>
          <Link href="/admin/ai/providers" className="text-sm text-primary hover:underline">Back to Providers</Link>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div><Label>Name (ID)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Display Name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
        <div><Label>Base URL</Label><Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} /></div>
        <div><Label>API Key</Label><Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} /></div>
        <div>
          <Label>Tier</Label>
          <select className="w-full rounded-md border px-3 py-2" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
            <option value="production">Production</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <Label>Active</Label>
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
        </div>
      </div>
      <Link href={`/admin/ai/providers/${provider.id}/models`} className="text-primary hover:underline font-medium">
        Manage Models ({provider.models?.length || 0}) &rarr;
      </Link>
    </div>
  );
}
