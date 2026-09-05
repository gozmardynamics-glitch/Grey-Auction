import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import { BidActivityItem } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

export function BidsTab({ bids }: { bids: BidActivityItem[] }) {
  const t = useTranslations('admin.buyers.bidsTab');
  if (!bids || bids.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t('empty')}</p>
    );
  }

  const sanitized = bids.map((bid) => ({
    ...bid,
    auctionId: bid.auctionId || '-',
    item: bid.item || '-',
    type: bid.type || '-',
    date: bid.date || '-',
    status: bid.status || 'Watching',
  }));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead className="text-xs">{t('auctionId')}</TableHead>
            <TableHead className="text-xs">{t('item')}</TableHead>
            <TableHead className="text-xs">{t('bidAmount')}</TableHead>
            <TableHead className="text-xs">{t('type')}</TableHead>
            <TableHead className="text-xs">{t('date')}</TableHead>
            <TableHead className="text-xs">{t('status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sanitized.map((bid, index) => (
            <TableRow key={index}>
              <TableCell className="text-xs font-medium">
                {bid.auctionId}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {bid.itemImage && (
                    <div className="relative h-8 w-10">
                      <Image
                        src={bid.itemImage}
                        alt={bid.item}
                        fill
                        className="rounded object-cover"
                      />
                    </div>
                  )}
                  <span className="text-xs truncate max-w-[140px]">
                    {bid.item}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {formatCurrency(bid.bidAmount)}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {bid.type}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {bid.date}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusStyles[bid.status] || ''}`}
                >
                  {bid.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
