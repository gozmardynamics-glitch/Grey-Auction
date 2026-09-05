'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

/**
 * Column-hook factory: the column array lives inside a hook so headers
 * resolve per locale via next-intl (same pattern as
 * settings/components/activity_logs_column.tsx).
 */
export function useAuctionsColumns(
  onViewDetails: (auction: Auction) => void
): ColumnDef<Auction>[] {
  const t = useTranslations('admin.auctions.table');

  return useMemo<ColumnDef<Auction>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('selectAll')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('selectRow')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'id',
        header: t('auctionId'),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-medium">
            {row.getValue('id')}
          </span>
        ),
      },
      {
        accessorKey: 'item',
        header: t('item'),
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
        header: t('seller'),
      },
      {
        accessorKey: 'category',
        header: t('category'),
      },
      {
        accessorKey: 'startingBid',
        header: t('startingBid'),
        cell: ({ row }) => formatCurrency(row.getValue('startingBid')),
      },
      {
        accessorKey: 'currentBid',
        header: t('currentBid'),
        cell: ({ row }) => formatCurrency(row.getValue('currentBid')),
      },
      {
        accessorKey: 'bids',
        header: t('bids'),
        cell: ({ row }) => (
          <span className="text-center">{row.getValue('bids')}</span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: t('endDate'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue('endDate')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('status'),
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
                  <span className="sr-only">{t('openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(auction)}>
                  {t('viewDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  {t('deleteAuction')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, onViewDetails]
  );
}
