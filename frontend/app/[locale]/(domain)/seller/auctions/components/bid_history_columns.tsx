import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/shared/utils/helpers';
import { BidHistoryItem } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

export const bidHistoryColumns: ColumnDef<BidHistoryItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-xs font-medium">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="text-xs">
        {formatCurrency(row.getValue('amount') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue('type')}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">{row.getValue('date')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BidHistoryItem['status'];
      return (
        <Badge
          variant="outline"
          className={cn('text-xs', statusStyles[status])}
        >
          {status}
        </Badge>
      );
    },
  },
];
