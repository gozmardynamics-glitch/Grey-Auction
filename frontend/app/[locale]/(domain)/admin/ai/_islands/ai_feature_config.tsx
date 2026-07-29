'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/shared/components/common/button';
import { Input } from '@/shared/components/common/input';
import { Label } from '@/shared/components/common/label';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import Link from 'next/link';
import type { AIFeatureConfig, LLMModel } from '../../models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AIFeatureConfig({ feature, allModels }: { feature: AIFeatureConfig; allModels: LLMModel[] }) {
  const [form, setForm] = useState<{
    displayName: string;
    description: string;
    quality: string;
    systemPrompt: string;
    temperature: string;
    maxTokens: string;
    rateLimitPerMinute: string;
    rateLimitPerDay: string;
    primaryModelId: string;
    fallbackModelId: string;
    tertiaryModelId: string;
    isEnabled: boolean;
  }>({
    displayName: feature.displayName,
    description: feature.description || '',
    quality: feature.quality,
    systemPrompt: feature.systemPrompt || '',
    temperature: String(feature.temperature),
    maxTokens: String(feature.maxTokens),
    rateLimitPerMinute: String(feature.rateLimitPerMinute),
    rateLimitPerDay: String(feature.rateLimitPerDay),
    primaryModelId: feature.primaryModelId || '',
    fallbackModelId: feature.fallbackModelId || '',
    tertiaryModelId: feature.tertiaryModelId || '',
    isEnabled: feature.isEnabled,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.primaryModelId) payload.primaryModelId = null;
      if (!payload.fallbackModelId) payload.fallbackModelId = null;
      if (!payload.tertiaryModelId) payload.tertiaryModelId = null;
      payload.temperature = Number(form.temperature);
      payload.maxTokens = Number(form.maxTokens);
      payload.rateLimitPerMinute = Number(form.rateLimitPerMinute);
      payload.rateLimitPerDay = Number(form.rateLimitPerDay);

      const res = await fetch(`${API_URL}/admin/ai/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Feature config updated');
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  }, [form, feature.id]);

  const modelOptions = allModels.map((m) => (
    <option key={m.id} value={m.id}>{m.displayName} ({m.modelId})</option>
  ));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configure: {feature.displayName}</h2>
          <p className="text-sm text-muted-foreground">Feature Key: {feature.featureKey} &middot; Section: {feature.section}</p>
          <Link href="/admin/ai/features" className="text-sm text-primary hover:underline">Back to Features</Link>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div><Label>Display Name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
        <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <Label>Quality</Label>
          <select className="w-full rounded-md border px-3 py-2" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div><Label>Temperature ({form.temperature})</Label><Input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
        <div><Label>Max Tokens</Label><Input type="number" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: e.target.value })} /></div>
        <div><Label>Rate Limit (per minute)</Label><Input type="number" value={form.rateLimitPerMinute} onChange={(e) => setForm({ ...form, rateLimitPerMinute: e.target.value })} /></div>
        <div><Label>Rate Limit (per day)</Label><Input type="number" value={form.rateLimitPerDay} onChange={(e) => setForm({ ...form, rateLimitPerDay: e.target.value })} /></div>
      </div>
      <div>
        <Label>System Prompt</Label>
        <textarea className="w-full rounded-md border px-3 py-2 min-h-[120px] font-mono text-sm" value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div><Label>Primary Model</Label><select className="w-full rounded-md border px-3 py-2" value={form.primaryModelId} onChange={(e) => setForm({ ...form, primaryModelId: e.target.value })}><option value="">None</option>{modelOptions}</select></div>
        <div><Label>Fallback Model</Label><select className="w-full rounded-md border px-3 py-2" value={form.fallbackModelId} onChange={(e) => setForm({ ...form, fallbackModelId: e.target.value })}><option value="">None</option>{modelOptions}</select></div>
        <div><Label>Tertiary Model</Label><select className="w-full rounded-md border px-3 py-2" value={form.tertiaryModelId} onChange={(e) => setForm({ ...form, tertiaryModelId: e.target.value })}><option value="">None</option>{modelOptions}</select></div>
      </div>
      <div className="flex items-center gap-4">
        <Label>Enabled</Label>
        <Switch checked={form.isEnabled} onCheckedChange={(v) => setForm({ ...form, isEnabled: v })} />
      </div>
    </div>
  );
}
