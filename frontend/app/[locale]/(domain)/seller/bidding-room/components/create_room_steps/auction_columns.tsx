'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

import { Badge, Checkbox } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { type Listing } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

export const auctionColumns: ColumnDef<Listing>[] = [
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
    accessorKey: 'lotId',
    header: 'Auction ID',
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.itemImage && (
          <div className="relative h-8 w-8 overflow-hidden rounded bg-muted">
            <Image
              src={row.original.itemImage}
              alt={row.original.item}
              fill
              className="object-cover"
            />
          </div>
        )}
        <span className="font-medium">{row.original.item}</span>
      </div>
    ),
  },
  {
    accessorKey: 'reservePrice',
    header: 'Reserve Price',
    cell: ({ row }) =>
      typeof row.original.reservePrice === 'string'
        ? row.original.reservePrice
        : row.original.reservePrice
          ? 'Yes'
          : 'No',
  },
  {
    accessorKey: 'startingBid',
    header: 'Starting Bid',
    cell: ({ row }) => formatCurrency(row.original.startingBid),
  },
  {
    accessorKey: 'currentBid',
    header: 'Current Bid',
    cell: ({ row }) =>
      row.original.currentBid
        ? formatCurrency(row.original.currentBid)
        : '—',
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.date}</span>
    ),
  },
  {
    accessorKey: 'timeLeft',
    header: 'Time Left',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={cn(
          'font-medium',
          statusStyles[row.original.status] ?? ''
        )}
      >
        {row.original.status}
      </Badge>
    ),
  },
];
