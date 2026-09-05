'use client';

import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { ActivityLog } from './audit_logs_data';
import { statusStyles } from '@/shared/utils/helpers';

export function useActivityLogColumns(): ColumnDef<ActivityLog>[] {
  const t = useTranslations('admin.settings.activityLogs');
  return [
    {
      accessorKey: 'user',
      header: t('user'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('user')}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: t('action'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('action')}</span>
      ),
    },
    {
      accessorKey: 'target',
      header: t('target'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('target')}</span>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: t('timestamp'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('timestamp')}</span>
      ),
    },
    {
      accessorKey: 'ip',
      header: t('ip'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('ip')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as ActivityLog['status'];
        return (
          <Badge
            variant="secondary"
            className={cn('font-medium', statusStyles[status])}
          >
            {status}
          </Badge>
        );
      },
    },
  ];
}
