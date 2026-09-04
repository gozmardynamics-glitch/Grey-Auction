import { Badge } from '@/shared/components/common';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/shared/components/common/badge';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface ListedAuctions {
  id: string;
  type: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const priorityVariants: Record<ListedAuctions['priority'], BadgeVariant> = {
  High: 'destructive',
  Medium: 'secondary',
  Low: 'outline',
};

const statusVariants: Record<ListedAuctions['status'], BadgeVariant> = {
  Pending: 'secondary',
  Approved: 'default',
  Rejected: 'destructive',
};

/** Column factory so headers resolve through next-intl per locale. */
export function useListedAuctionsColumns(): ColumnDef<ListedAuctions>[] {
  const t = useTranslations('seller.home');
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
        const priority = row.getValue('priority') as ListedAuctions['priority'];
        return (
          <Badge
           variant={priorityVariants[priority]}>
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
        const status = row.getValue('status') as ListedAuctions['status'];
        return (
          <Badge variant={statusVariants[status]}>
            {status}
          </Badge>
        );
      },
    },
  ];
}
