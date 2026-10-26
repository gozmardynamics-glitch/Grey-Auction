'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bot, Play, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface RegistryModel {
  id: string;
  modelId: string;
  displayName: string;
  isActive?: boolean;
}

interface RegistryProvider {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  isActive: boolean;
  hasApiKey?: boolean;
  models?: RegistryModel[];
}

interface AgentSettings {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  providerName: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  isEnabled: boolean;
}

/**
 * Agent settings: point the agent at any provider/model in the LLM registry —
 * including custom OpenAI-compatible providers an admin registered — and run it
 * once to prove the wiring.
 */
export default function AgentSettingsEditor({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<AgentSettings | null>(null);
  const [providers, setProviders] = useState<RegistryProvider[]>([]);
  const [providerName, setProviderName] = useState('');
  const [modelId, setModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [agentsJson, providersJson] = await Promise.all([
        apiFetch<{ data?: AgentSettings[] }>('admin/agents/instances'),
        apiFetch<{ data?: RegistryProvider[] }>('admin/ai/providers'),
      ]);
      const list = Array.isArray(agentsJson.data) ? agentsJson.data : [];
      const found = list.find((a) => a.id === agentId) ?? null;
      setAgent(found);
      setProviderName(found?.providerName ?? '');
      setModelId(found?.modelId ?? '');
      setProviders(Array.isArray(providersJson.data) ? providersJson.data : []);
    } catch {
      toast.error('Could not load the agent settings');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const models = useMemo(
    () => providers.find((p) => p.name === providerName)?.models ?? [],
    [providers, providerName],
  );

  const save = async () => {
    setBusy('save');
    try {
      await apiFetch(`admin/agents/instances/${agentId}`, {
        method: 'PATCH',
        body: { providerName, modelId },
      });
      toast.success('Agent settings saved');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the settings');
    } finally {
      setBusy(null);
    }
  };

  const testRun = async () => {
    setBusy('test');
    try {
      const json = await apiFetch<{ data?: { output?: string } }>(
        `admin/agents/instances/${agentId}/execute`,
        {
          method: 'POST',
          body: { input: { probe: 'settings test run' }, context: {} },
        },
      );
      toast.success(
        'Agent replied: ' + String(json?.data?.output ?? '(empty response)').slice(0, 120),
      );
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'The agent run failed');
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading agent…</p>;
  }
  if (!agent) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Agent not found. <Link href="/admin/agents" className="text-primary hover:underline">Back to Agent Studio</Link>
      </p>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bot className="h-5 w-5 text-primary" />
            {agent.displayName || agent.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {agent.description || 'Configure which model this agent runs on.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              agent.isEnabled
                ? 'bg-emerald-100 text-emerald-700 border-0'
                : 'bg-muted text-muted-foreground border-0'
            }
          >
            {agent.isEnabled ? 'enabled' : 'disabled'}
          </Badge>
          <Button onClick={() => void save()} disabled={busy === 'save'} className="gap-2">
            <Save className="h-4 w-4" />
            {busy === 'save' ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={() => void testRun()}
            disabled={busy === 'test'}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {busy === 'test' ? 'Running…' : 'Test run'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No providers registered yet.{' '}
              <Link href="/admin/ai/providers" className="text-primary hover:underline">
                Add one
              </Link>{' '}
              — a custom OpenAI-compatible endpoint works too.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="agent-provider">Provider</Label>
                <select
                  id="agent-provider"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={providerName}
                  onChange={(e) => {
                    setProviderName(e.target.value);
                    setModelId('');
                  }}
                >
                  <option value="">— none —</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.displayName || p.name}
                      {p.isActive ? '' : ' (disabled)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent-model">Model</Label>
                <select
                  id="agent-model"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={!providerName}
                >
                  <option value="">{providerName ? '— pick a model —' : '— pick a provider first —'}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.modelId}>
                      {m.displayName} ({m.modelId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {providerName && models.length === 0 && (
            <p className="text-sm text-amber-700">
              This provider has no models registered yet. Add one under AI Providers, then come back.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The agent runs on this provider and model. Custom providers work as long as they speak the
            protocol selected on the provider (OpenAI-compatible by default).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
