'use client';

import { Hammer, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import { BidDetail } from '../../models';
import Image from 'next/image';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator />
      <h3 className="text-sm font-semibold">{children}</h3>
    </>
  );
}

interface BidDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid: BidDetail | null;
}

export default function BidDetailsModal({
  open,
  onOpenChange,
  bid,
}: BidDetailsModalProps) {
  const t = useTranslations('admin.bids.details');
  if (!bid) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[50%] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 p-6 pt-4 lg:grid-cols-2">
          {/* ====== LEFT COLUMN ====== */}
          <div className="space-y-5">
            {/* Item Header */}
            <Card className="flex gap-4 bg-card p-2 shadow-xs">
              {bid.itemImage && (
                <div className="relative h-16 w-20">
                  <Image
                    src={bid.itemImage}
                    alt={bid.item}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {bid.id}
                  </span>
                  <Badge variant="outline" className={statusStyles[bid.status]}>
                    {bid.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{bid.item}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {bid.sellerReserveNotYetMet && (
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {t('sellerReserveNotYetMet')}
                    </span>
                  )}
                  {bid.saleStatus && (
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {t('saleStatus', { status: bid.saleStatus })}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Auction Information */}
            <SectionTitle>{t('auctionInformation')}</SectionTitle>
            <Card className="grid grid-cols-2 gap-4 bg-card p-2 shadow-xs">
              <InfoRow label={t('category')} value={bid.category} />
              <InfoRow label={t('duration')} value={bid.duration || '-'} />
              <InfoRow label={t('startDate')} value={bid.startDate || '-'} />
              <InfoRow label={t('endDate')} value={bid.endDate} />
            </Card>

            {/* Bid Information */}
            <SectionTitle>{t('bidInformation')}</SectionTitle>
            <Card className="grid grid-cols-2 gap-4 bg-card p-2 shadow-xs">
              <InfoRow
                label={t('startingPrice')}
                value={
                  bid.startingPrice ? formatCurrency(bid.startingPrice) : '-'
                }
              />
              <InfoRow
                label={t('bidIncrement')}
                value={
                  bid.bidIncrement ? formatCurrency(bid.bidIncrement) : '-'
                }
              />
              <InfoRow label={t('reservePrice')} value={bid.reservePrice || '-'} />
              <InfoRow
                label={t('reservePriceAt')}
                value={
                  bid.reservePriceAmount
                    ? formatCurrency(bid.reservePriceAmount)
                    : '-'
                }
              />
              <InfoRow label={t('allowBuyNow')} value={bid.allowBuyNow || '-'} />
              <InfoRow
                label={t('buyNowAt')}
                value={bid.buyNowPrice ? formatCurrency(bid.buyNowPrice) : '-'}
              />
            </Card>
          </div>

          {/* ====== RIGHT COLUMN ====== */}
          <div className="space-y-5">
            {/* Bid History */}
            <Card className="space-y-3 bg-card p-2 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('bidHistory')}</h3>
                {bid.totalBids !== undefined && (
                  <Badge className="bg-background border border-border p-2 text-xs text-muted-foreground">
                    <Hammer />
                    {t('bidsCount', { count: String(bid.totalBids).padStart(2, '0') })}
                  </Badge>
                )}
              </div>
              {bid.bidHistory && bid.bidHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-background">
                      <TableRow>
                        <TableHead className="text-xs">{t('bidder')}</TableHead>
                        <TableHead className="text-xs">{t('bidAmount')}</TableHead>
                        <TableHead className="text-xs">{t('type')}</TableHead>
                        <TableHead className="text-xs">{t('date')}</TableHead>
                        <TableHead className="text-xs">{t('status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bid.bidHistory.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs font-medium">
                            {entry.bidder}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatCurrency(entry.bidAmount)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {entry.type}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {entry.date}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusStyles[entry.status] || ''}`}
                            >
                              {entry.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('noBids')}</p>
              )}
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
