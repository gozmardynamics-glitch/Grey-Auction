'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import Image from 'next/image';
import { Listing, ListingStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 3,
  }).format(value);

export const createListingColumns = (
  onViewDetails: (listing: Listing) => void
): ColumnDef<Listing>[] => [
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
    header: 'Lot ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">
        #{row.getValue('lotId')}
      </span>
    ),
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex items-center gap-2">
          {listing.itemImage && (
            <div className="relative h-8 w-8">
              <Image
                src={listing.itemImage}
                alt={listing.item}
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <span className="font-medium truncate max-w-[180px]">
            {listing.item}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'reservePrice',
    header: 'Reserve Price',
    cell: ({ row }) => {
      const value = row.getValue('reservePrice') as string | boolean;
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return value;
    },
  },
  {
    accessorKey: 'startingBid',
    header: 'Starting Bid',
    cell: ({ row }) => formatCurrency(row.getValue('startingBid')),
  },
  {
    accessorKey: 'currentBid',
    header: 'Current Bid',
    cell: ({ row }) => {
      const value = row.getValue('currentBid') as number | null;
      return value ? formatCurrency(value) : '-';
    },
  },
  {
    accessorKey: 'bids',
    header: 'Bids',
    cell: ({ row }) => {
      const value = row.getValue('bids') as number | null;
      return value ?? '-';
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">{row.getValue('date')}</span>
    ),
  },
  {
    accessorKey: 'timeLeft',
    header: 'Time Left',
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-sm">
        {row.getValue('timeLeft')}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as ListingStatus;
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
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(listing)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit listing</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete listing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
