import { Badge } from '@/shared/components/common';
import { ColumnDef } from '@tanstack/react-table';

export interface ListedAuctions {
  id: string;
  type: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const priorityVariants: Record<ListedAuctions['priority'], string> = {
  High: 'destructive',
  Medium: 'secondary',
  Low: 'outline',
};

const statusVariants: Record<ListedAuctions['status'], string> = {
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
         variant={priorityVariants[priority] as any}>
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
        <Badge variant={statusVariants[status] as any}>
          {status}
        </Badge>
      );
    },
  },
];