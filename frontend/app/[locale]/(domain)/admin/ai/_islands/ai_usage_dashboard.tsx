'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common/card';
import { MiniSpinner } from '@/shared/components/common/spinner';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
}

export default function AIUsageDashboard() {
  const authToken = useAppSelector((state) => state.auth.token);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    apiFetch<{ data?: UsageSummary }>('admin/ai/usage/summary', { token: authToken })
      .then((json) => setSummary(json.data ?? null))
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (loading) return <div className="flex justify-center py-12"><MiniSpinner /></div>;

  if (!summary) return <div className="text-center py-12 text-muted-foreground">No usage data available</div>;

  const providerEntries = Object.entries(summary.byProvider);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Tokens</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.totalTokens.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${Number(summary.totalCost).toFixed(4)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Providers Used</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{Object.keys(summary.byProvider).length}</div></CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cost by Provider</CardTitle></CardHeader>
          <CardContent>
            {providerEntries.length > 0 ? (
              <div className="space-y-3">
                {providerEntries.map(([name, data]) => (
                  <div key={name} className="flex justify-between items-center rounded-lg border p-3">
                    <span className="font-medium">{name}</span>
                    <span className="text-sm">${Number(data.cost).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tokens by Provider</CardTitle></CardHeader>
          <CardContent>
            {providerEntries.length > 0 ? (
              <div className="space-y-3">
                {providerEntries.map(([name, data]) => (
                  <div key={name} className="flex justify-between items-center rounded-lg border p-3">
                    <span className="font-medium">{name}</span>
                    <span className="text-sm">{data.tokens.toLocaleString()} tokens</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
