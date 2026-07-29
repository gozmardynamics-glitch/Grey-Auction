'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/shared/components/common/data_table';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import type { AIFeatureConfig } from '../../models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AIFeaturesList({ data }: { data: AIFeatureConfig[] }) {
  const [features, setFeatures] = useState<AIFeatureConfig[]>(data);

  const toggleFeature = useCallback(async (feature: AIFeatureConfig) => {
    try {
      const res = await fetch(`${API_URL}/admin/ai/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !feature.isEnabled }),
      });
      if (res.ok) {
        toast.success(`${feature.displayName} ${feature.isEnabled ? 'disabled' : 'enabled'}`);
        setFeatures((prev) => prev.map((f) => f.id === feature.id ? { ...f, isEnabled: !f.isEnabled } : f));
      } else {
        toast.error('Failed to toggle feature');
      }
    } catch {
      toast.error('Failed to toggle feature');
    }
  }, []);

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
