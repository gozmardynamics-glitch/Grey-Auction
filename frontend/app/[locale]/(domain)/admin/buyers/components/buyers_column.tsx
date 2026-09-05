
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';
import { Buyer, BuyerStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

export function useBuyersColumns(
  onViewDetails: (buyer: Buyer) => void,
  onSuspend: (buyer: Buyer) => void,
  onActivate: (buyer: Buyer) => void
): ColumnDef<Buyer>[] {
  const t = useTranslations('admin.buyers.table');
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
    header: t('buyerId'),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">
        {row.getValue('id')}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: t('name'),
    meta:{sticky:true},
    cell: ({ row }) => {
      const buyer = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={buyer.avatar} alt={buyer.name} />
            <AvatarFallback className="text-xs">{buyer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium truncate max-w-[180px]">
            {buyer.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: t('email'),
  },
  {
    accessorKey: 'location',
    header: t('location'),
  },
  {
    accessorKey: 'totalBids',
    header: t('totalBids'),
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('totalBids')}</span>
    ),
  },
  {
    accessorKey: 'totalWins',
    header: t('wins'),
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('totalWins')}</span>
    ),
  },
  {
    accessorKey: 'totalSpent',
    header: t('totalSpent'),
    cell: ({ row }) => formatCurrency(row.getValue('totalSpent')),
  },
  {
    accessorKey: 'joinDate',
    header: t('joinDate'),
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue('joinDate')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: t('status'),
    cell: ({ row }) => {
      const status = row.getValue('status') as BuyerStatus;
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
      const buyer = row.original;
      const isSuspended = buyer.status === 'Suspended';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('openMenu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(buyer)}>
              {t('viewDetails')}
            </DropdownMenuItem>
            {isSuspended ? (
              <DropdownMenuItem onClick={() => onActivate(buyer)}>
                {t('activateBuyer')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onSuspend(buyer)}
              >
                {t('suspendBuyer')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
    ],
    [t]
  );
}
