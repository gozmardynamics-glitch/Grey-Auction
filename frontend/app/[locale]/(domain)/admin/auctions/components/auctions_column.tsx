import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import { Auction, AuctionStatus } from '../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

export const Columns = (
  onViewDetails: (auction: Auction) => void
): ColumnDef<Auction>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'Auction ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">
        {row.getValue('id')}
      </span>
    ),
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <div className="flex items-center gap-2">
          {auction.itemImage && (
            <Image
              src={auction.itemImage}
              alt={auction.item}
              width={32}
              height={32}
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <span className="font-medium truncate max-w-[180px]">
            {auction.item}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'startingBid',
    header: 'Starting Bid',
    cell: ({ row }) => formatCurrency(row.getValue('startingBid')),
  },
  {
    accessorKey: 'currentBid',
    header: 'Current Bid',
    cell: ({ row }) => formatCurrency(row.getValue('currentBid')),
  },
  {
    accessorKey: 'bids',
    header: 'Bids',
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('bids')}</span>
    ),
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue('endDate')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as AuctionStatus;
      return (
        <Badge variant="outline" className={statusStyles[status]}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(auction)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete auction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
