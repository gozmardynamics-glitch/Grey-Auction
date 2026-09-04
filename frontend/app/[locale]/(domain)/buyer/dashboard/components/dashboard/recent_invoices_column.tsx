'use client';

import { MoreVertical } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { InvoiceStatus, RecentInvoice } from '../../../models';

/** Column factory so headers resolve through next-intl per locale. */
export function useRecentInvoicesColumns(): ColumnDef<RecentInvoice>[] {
  const t = useTranslations('buyer.home');
  return [
    {
      accessorKey: 'id',
      header: t('invoiceId'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'item',
      header: t('item'),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-12 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={invoice.image}
                alt={invoice.item}
                width={48}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-medium">{invoice.item}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'vendor',
      header: t('vendor'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('vendor')}</span>
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
        <span className="text-muted-foreground">{row.getValue('date')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as InvoiceStatus;
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
            <DropdownMenuItem>{t('viewDetails')}</DropdownMenuItem>
            <DropdownMenuItem>{t('download')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
