'use client';

import { useCallback, useState } from 'react';
import { DataTable } from '@/shared/components/common/data_table';
import { Badge } from '@/shared/components/common/badge';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import type { AIFeatureConfig } from '../../models';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

export default function AIFeaturesList({ data }: { data: AIFeatureConfig[] }) {
  const authToken = useAppSelector((state) => state.auth.token);
  const [features, setFeatures] = useState<AIFeatureConfig[]>(data);

  const toggleFeature = useCallback(async (feature: AIFeatureConfig) => {
    try {
      await apiFetch(`admin/ai/features/${feature.id}`, {
        method: 'PATCH',
        token: authToken,
        body: { isEnabled: !feature.isEnabled },
      });
      toast.success(`${feature.displayName} ${feature.isEnabled ? 'disabled' : 'enabled'}`);
      setFeatures((prev) => prev.map((f) => f.id === feature.id ? { ...f, isEnabled: !f.isEnabled } : f));
    } catch {
      toast.error('Failed to toggle feature');
    }
  }, [authToken]);

  const columns: ColumnDef<AIFeatureConfig>[] = [
    {
      accessorKey: 'displayName',
      header: 'Feature',
      cell: ({ row }) => (
        <Link href={`/admin/ai/features/${row.original.id}`} className="text-primary hover:underline font-medium">
          {row.original.displayName}
        </Link>
      ),
    },
    { accessorKey: 'section', header: 'Section' },
    {
      accessorKey: 'primaryModel',
      header: 'Primary Model',
      cell: ({ row }) => row.original.primaryModel?.displayName || <span className="text-muted-foreground">None</span>,
    },
    {
      accessorKey: 'quality',
      header: 'Quality',
      cell: ({ row }) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
          premium: 'default', standard: 'secondary', draft: 'outline',
        };
        return <Badge variant={variants[row.original.quality] || 'secondary'}>{row.original.quality}</Badge>;
      },
    },
    {
      accessorKey: 'isEnabled',
      header: 'Enabled',
      cell: ({ row }) => (
        <Switch checked={row.original.isEnabled} onCheckedChange={() => toggleFeature(row.original)} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">AI Feature Configuration</h2>
      <DataTable columns={columns} data={features} emptyTitle="No Feature Configs" emptyDescription="No feature configurations found." />
    </div>
  );
}
