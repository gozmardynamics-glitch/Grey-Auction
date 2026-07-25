import { ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/shared/components/common';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';
import Image from 'next/image';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { BidStatus, MyBid } from '../../../models';

export const myBidsColumns: ColumnDef<MyBid>[] = [
  {
    accessorKey: 'auction',
    header: 'Auction',
    cell: ({ row }) => {
      const bid = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
            <Image
              src={bid.image}
              alt={bid.auction}
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-medium">{bid.auction}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'lot',
    header: 'Lot',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('lot')}</span>
    ),
  },
  {
    accessorKey: 'currentBid',
    header: 'Current Bid',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue('currentBid'))}
      </span>
    ),
  },
  {
    accessorKey: 'yourBid',
    header: 'Your Bid',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue('yourBid'))}
      </span>
    ),
  },
  {
    accessorKey: 'time',
    header: 'Time',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('time')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BidStatus;
      return (
        <Badge variant="outline" className={statusStyles[status]}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View auction</DropdownMenuItem>
          <DropdownMenuItem>Place bid</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
