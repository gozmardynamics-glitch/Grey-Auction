import { Badge } from '@/shared/components/common';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/shared/components/common/badge';
import { ColumnDef } from '@tanstack/react-table';

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

export const columns: ColumnDef<ListedAuctions>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate block">
        {row.getValue('description')}
      </span>
    ),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
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
    header: 'Date',
  },
  {
    accessorKey: 'status',
    header: 'Status',
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