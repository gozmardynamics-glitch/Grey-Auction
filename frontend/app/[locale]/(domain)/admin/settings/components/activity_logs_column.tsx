import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { ActivityLog } from './audit_logs_data';
import { statusStyles } from '@/shared/utils/helpers';

export const activityLogColumns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('user')}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('action')}</span>
    ),
  },
  {
    accessorKey: 'target',
    header: 'Target',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('target')}</span>
    ),
  },
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('timestamp')}</span>
    ),
  },
  {
    accessorKey: 'ip',
    header: 'IP',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('ip')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
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