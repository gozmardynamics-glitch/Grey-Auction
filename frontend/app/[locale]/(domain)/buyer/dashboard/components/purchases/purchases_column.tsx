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
import { InvoiceStatus, PurchaseInvoice } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

export const purchasesColumns = (
  onView: (invoice: PurchaseInvoice) => void
): ColumnDef<PurchaseInvoice>[] => [
  {
    accessorKey: 'invoiceId',
    header: 'Invoice ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue('invoiceId')}</span>
    ),
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
            <Image
              src={invoice.image}
              alt={invoice.item}
              width={56}
              height={40}
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
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(row.original)}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem>Download invoice</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
