'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/shared/components/common/data_table';
import { Badge } from '@/shared/components/common/badge';
import { Input } from '@/shared/components/common/input';
import { MiniSpinner } from '@/shared/components/common/spinner';
import { ColumnDef } from '@tanstack/react-table';
import type { AIUsageLog } from '../../models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AIUsageLogs() {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ feature: '', dateFrom: '', dateTo: '' });

  const fetchLogs = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.feature) params.set('feature', filters.feature);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    fetch(`${API_URL}/admin/ai/usage?${params}`)
      .then((res) => res.json())
      .then((json) => setLogs(json.data || []))
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns: ColumnDef<AIUsageLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    { accessorKey: 'featureKey', header: 'Feature' },
    { accessorKey: 'modelId', header: 'Model' },
    { accessorKey: 'providerName', header: 'Provider' },
    {
      accessorKey: 'promptTokens',
      header: 'Tokens',
      cell: ({ row }) => `${row.original.promptTokens + row.original.completionTokens}`,
    },
    {
      accessorKey: 'estimatedCost',
      header: 'Cost',
      cell: ({ row }) => `$${Number(row.original.estimatedCost).toFixed(6)}`,
    },
    { accessorKey: 'latencyMs', header: 'Latency', cell: ({ row }) => `${row.original.latencyMs}ms` },
    {
      accessorKey: 'success',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.success ? 'default' : 'destructive'}>
          {row.original.success ? 'Success' : 'Failed'}
        </Badge>
      ),
    },
    { accessorKey: 'attemptNumber', header: 'Attempt' },
  ];

  const uniqueFeatures = [...new Set(logs.map((l) => l.featureKey))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-sm font-medium block mb-1">Feature</label>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.feature}
            onChange={(e) => setFilters({ ...filters, feature: e.target.value })}
          >
            <option value="">All Features</option>
            {uniqueFeatures.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Date From</label>
          <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Date To</label>
          <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
        </div>
        <button
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
          onClick={() => { setLoading(true); fetchLogs(); }}
        >
          Apply Filters
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><MiniSpinner /></div>
      ) : (
        <DataTable columns={columns} data={logs} emptyTitle="No Logs" emptyDescription="No AI usage logs found." />
      )}
    </div>
  );
}
