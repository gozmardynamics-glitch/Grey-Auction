'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common/card';
import { Badge } from '@/shared/components/common/badge';
import { toast } from 'sonner';
import { Cpu, Layers, Zap, DollarSign } from 'lucide-react';
import type { LLMProvider, AIUsageLog } from '../../models';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AIDashboardProps {
  providers: LLMProvider[];
  summary: { totalTokens: number; totalCost: number; byProvider: Record<string, { tokens: number; cost: number }> };
}

export default function AIDashboard({ providers, summary }: AIDashboardProps) {
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);

  const fetchUsage = useCallback(() => {
    fetch(`${API_URL}/admin/ai/usage`)
      .then((response) => response.json())
      .then((data) => setUsageLogs(data.data || []))
      .catch(() => toast.error('Failed to load usage data'));
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const activeProviders = providers.filter((p) => p.isActive).length;
  const totalModels = providers.reduce((sum, p) => sum + (p.models?.length || 0), 0);
  const enabledFeatures = usageLogs.length > 0 ? [...new Set(usageLogs.map((l) => l.featureKey))].length : 0;

  const chartData = Object.entries(summary.byProvider || {}).map(([name, data]) => ({
    name,
    cost: Number(data.cost.toFixed(4)),
    tokens: data.tokens,
  }));

  const providerHealth = providers.map((p) => ({
    name: p.displayName,
    status: p.isActive ? 'Healthy' : 'Inactive',
    models: p.models?.length || 0,
    tier: p.tier,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProviders}/{providers.length}</div>
            <p className="text-xs text-muted-foreground">{providers.length - activeProviders} inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Models</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModels}</div>
            <p className="text-xs text-muted-foreground">Across {providers.length} providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Features Active</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledFeatures}</div>
            <p className="text-xs text-muted-foreground">17 configurable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(summary.totalCost).toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">{summary.totalTokens.toLocaleString()} tokens</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cost by Provider</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="space-y-2">
                {chartData.map((d) => (
                  <div key={d.name} className="flex justify-between items-center">
                    <span className="text-sm">{d.name}</span>
                    <span className="text-sm font-medium">${d.cost.toFixed(4)} ({d.tokens.toLocaleString()} tokens)</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">No usage data yet</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Provider Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providerHealth.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.models} models &middot; {p.tier}</p>
                  </div>
                  <Badge variant={p.status === 'Healthy' ? 'default' : 'secondary'}>{p.status}</Badge>
                </div>
              ))}
              {providerHealth.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No providers configured</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/ai/providers" className="text-sm text-primary hover:underline">Manage Providers</Link>
        <Link href="/admin/ai/features" className="text-sm text-primary hover:underline">Configure Features</Link>
        <Link href="/admin/ai/usage" className="text-sm text-primary hover:underline">View Usage</Link>
      </div>
    </div>
  );
}
