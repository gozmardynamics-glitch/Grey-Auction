import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/components/common';

import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { ActiveAuction, AuctionStatus } from '../../../models';

/** Column factory so headers resolve through next-intl per locale. */
export function useActiveAuctionsColumns(): ColumnDef<ActiveAuction>[] {
  const t = useTranslations('buyer.home');
  return [
    {
      accessorKey: 'name',
      header: t('item'),
      cell: ({ row }) => {
        const auction = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={auction.image}
                alt={auction.name}
                width={64}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{auction.name}</p>
              <p className="text-xs text-muted-foreground">{auction.details}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'currentBid',
      header: t('currentBid'),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('currentBid'))}
        </span>
      ),
    },
    {
      accessorKey: 'timeLeft',
      header: t('time'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('timeLeft')}</span>
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
    },
  ];
}
