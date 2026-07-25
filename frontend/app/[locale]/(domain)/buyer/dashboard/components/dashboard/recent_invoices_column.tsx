'use client';

import { MoreVertical } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

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

export const recentInvoicesColumns: ColumnDef<RecentInvoice>[] = [
  {
    accessorKey: 'id',
    header: 'Invoice ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'item',
    header: 'Item',
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
    header: 'Vendor',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('vendor')}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue('amount'))}
      </span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('date')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Download</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
