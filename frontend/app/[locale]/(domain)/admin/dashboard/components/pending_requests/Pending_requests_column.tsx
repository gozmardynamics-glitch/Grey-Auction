import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

export interface PendingRequest {
  id: string;
  type: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const priorityVariants: Record<PendingRequest['priority'], BadgeVariant> = {
  High: 'destructive',
  Medium: 'secondary',
  Low: 'outline',
};

const statusVariants: Record<PendingRequest['status'], BadgeVariant> = {
  Pending: 'secondary',
  Approved: 'default',
  Rejected: 'destructive',
};

/** Column factory so headers resolve through next-intl per locale. */
export function usePendingRequestColumns(): ColumnDef<PendingRequest>[] {
  const t = useTranslations('admin.home');
  return [
    {
      accessorKey: 'id',
      header: t('id'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: t('type'),
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">
          {row.getValue('description')}
        </span>
      ),
    },
    {
      accessorKey: 'priority',
      header: t('priority'),
      cell: ({ row }) => {
        const priority = row.getValue('priority') as PendingRequest['priority'];
        return (
          <Badge variant={priorityVariants[priority]}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'date',
      header: t('date'),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as PendingRequest['status'];
        return (
          <Badge variant={statusVariants[status]}>
            {status}
          </Badge>
        );
      },
    },
  ];
}
