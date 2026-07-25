import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, NotebookText } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Sale } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';
import Image from 'next/image';

interface SalesColumnActions {
  onViewReceipt?: (sale: Sale) => void;
}

export const createColumns = (
  actions?: SalesColumnActions
): ColumnDef<Sale>[] => [
  {
    accessorKey: 'saleId',
    header: 'Sale ID',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <NotebookText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.getValue('saleId')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'item',
    header: 'Item',
    meta:{sticky:true},
    cell: ({ row }) => {
      const item = row.original.item;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-md bg-muted">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium">{item.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'buyer',
    header: 'Buyer',
    cell: ({ row }) => {
      const buyer = row.original.buyer;
      const initials = buyer.name
        .split(' ')
        .map((n) => n[0])
        .join('');
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{buyer.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className="text-sm">{row.getValue('type')}</span>,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = row.getValue('price') as number;
      return <span className="text-sm">₦{price.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <span className="text-sm">{row.getValue('date')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Sale['status'];
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
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const sale = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions?.onViewReceipt?.(sale)}>
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
