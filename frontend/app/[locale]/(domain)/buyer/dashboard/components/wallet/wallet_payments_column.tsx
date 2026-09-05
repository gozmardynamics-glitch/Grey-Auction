'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
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

import {
  formatCurrency,
  statusStyles,
  typeClassName,
} from '@/shared/utils/helpers';
import {
  WalletPayment,
  WalletPaymentStatus,
  WalletPaymentType,
} from '../../../models';

/**
 * Column-hook factory (established Pattern 2): the column array lives inside a
 * hook so headers resolve per locale via next-intl.
 */
export const useWalletPaymentColumns = (
  onViewDetails: (payment: WalletPayment) => void
): ColumnDef<WalletPayment>[] => {
  const t = useTranslations('buyer.wallet.table');

  return useMemo(
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
        accessorKey: 'referenceId',
        header: t('referenceId'),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-medium">
            {row.getValue('referenceId')}
          </span>
        ),
      },
      {
        accessorKey: 'paymentName',
        header: t('paymentName'),
        cell: ({ row }) => (
          <span className="font-medium truncate max-w-[180px]">
            {row.getValue('paymentName')}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('type'),
        cell: ({ row }) => {
          const type = row.getValue('type') as WalletPaymentType;
          return (
            <Badge variant="outline" className={typeClassName[type]}>
              {type}
            </Badge>
          );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'method',
        header: t('method'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue('method')}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('amount'),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.getValue('amount'))}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('date'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue('date')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('status'),
        cell: ({ row }) => {
          const status = row.getValue('status') as WalletPaymentStatus;
          return (
            <Badge variant="outline" className={statusStyles[status]}>
              {status}
            </Badge>
          );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(payment)}>
                  {t('viewDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem>{t('downloadReceipt')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, onViewDetails]
  );
};
