import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { MoreHorizontal } from 'lucide-react';

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

import { Seller, SellerStatus } from '../../models';
import { statusStyles, formatCurrency } from '@/shared/utils/helpers';

export function useSellersColumns(
  onViewDetails: (seller: Seller) => void,
  onSuspend: (seller: Seller) => void,
  onActivate: (seller: Seller) => void
): ColumnDef<Seller>[] {
  const t = useTranslations('admin.sellers.table');
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
    header: t('sellerId'),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">
        {row.getValue('id')}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: t('name'),
    cell: ({ row }) => {
      const seller = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={seller.avatar} alt={seller.name} />
            <AvatarFallback className="text-xs">{seller.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium truncate max-w-[180px]">
            {seller.name}
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
    accessorKey: 'totalListings',
    header: t('listings'),
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('totalListings')}</span>
    ),
  },
  {
    accessorKey: 'totalSales',
    header: t('sales'),
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('totalSales')}</span>
    ),
  },
  {
    accessorKey: 'totalRevenue',
    header: t('revenue'),
    cell: ({ row }) => formatCurrency(row.getValue('totalRevenue')),
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
      const status = row.getValue('status') as SellerStatus;
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
      const seller = row.original;
      const isSuspended = seller.status === 'Suspended';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('openMenu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(seller)}>
              {t('viewDetails')}
            </DropdownMenuItem>
            {isSuspended ? (
              <DropdownMenuItem onClick={() => onActivate(seller)}>
                {t('activateSeller')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onSuspend(seller)}
              >
                {t('suspendSeller')}
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
