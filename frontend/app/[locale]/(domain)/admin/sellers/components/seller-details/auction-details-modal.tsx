import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Check, MapPin, Phone, X } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';

import { AuctionDetail } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: AuctionDetail | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function AuctionDetailsModal({
  open,
  onOpenChange,
  auction,
}: AuctionDetailsModalProps) {
  const t = useTranslations('admin.sellers.auctionDetails');
  if (!auction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-4">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Auction Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('auctionInfo')}</h3>
              <InfoRow label={t('auctionId')} value={auction.auctionId} />
              <Separator />
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-muted-foreground">{t('item')}</p>
                <div className="flex items-center gap-2">
                  {auction.itemImage && (
                    <Image
                      src={auction.itemImage}
                      alt={auction.item}
                      className="h-8 w-10 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium">{auction.item}</span>
                </div>
              </div>
              <Separator />
              <InfoRow label={t('category')} value={auction.category} />
              <Separator />
              <InfoRow label={t('duration')} value={auction.duration} />
              <Separator />
              <InfoRow label={t('startDate')} value={auction.startDate} />
              <Separator />
              <InfoRow label={t('endDate')} value={auction.endDate} />
            </div>

            <Separator />

            {/* Bid Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('bidInfo')}</h3>
              <InfoRow
                label={t('startingPrice')}
                value={formatCurrency(auction.startingPrice)}
              />
              <Separator />
              <InfoRow
                label={t('bidIncrement')}
                value={formatCurrency(auction.bidIncrement)}
              />
              <Separator />
              <InfoRow
                label={t('reservePrice')}
                value={formatCurrency(auction.reservePrice)}
              />
              <Separator />
              <InfoRow
                label={t('minBidPrice')}
                value={formatCurrency(auction.minimumBidPrice)}
              />
              <Separator />
              <InfoRow
                label={t('allowBuyNow')}
                value={auction.allowBuyNow ? 'Yes' : 'No'}
              />
              <Separator />
              <InfoRow
                label={t('buyNowPrice')}
                value={formatCurrency(auction.buyNowPrice)}
              />
            </div>

            <Separator />

            {/* Inspection Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('inspectionInfo')}</h3>
              <InfoRow
                label={t('allowInspection')}
                value={auction.allowInspection ? 'Yes' : 'No'}
              />
              <Separator />
              <InfoRow
                label={t('inspectionDuration')}
                value={auction.inspectionDuration}
              />
              <Separator />
              <InfoRow
                label={t('inspectionAddress')}
                value={auction.inspectionAddress}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Seller Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('sellerHeading')}</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={auction.seller.avatar} alt={auction.seller.name} />
                    <AvatarFallback>{auction.seller.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {auction.seller.name}
                      </p>
                      {auction.seller.verified && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-tertiary/10 text-tertiary-1 border-tertiary/20"
                        >
                          Verified
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                      >
                        {auction.seller.sellerType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {auction.seller.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {auction.seller.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {auction.seller.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('bidHistory')}</h3>
              {auction.bidHistory.length === 0 ? (
                <EmptyState
                  title={t('noBidsTitle')}
                  description={t('noBidsDescription')}
                  className="py-8"
                />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-background">
                      <TableRow>
                        <TableHead className="text-xs">{t('name')}</TableHead>
                        <TableHead className="text-xs">{t('bidAmount')}</TableHead>
                        <TableHead className="text-xs">{t('timestamp')}</TableHead>
                        <TableHead className="text-xs">{t('status')}</TableHead>
                        <TableHead className="text-xs">{t('action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auction.bidHistory.map((bid, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={bid.avatar} alt={bid.name} />
                                <AvatarFallback className="text-xs">{bid.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{bid.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatCurrency(bid.amount)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {bid.timestamp}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusStyles[bid.status] || ''}`}
                            >
                              {bid.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bid.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-tertiary-1 hover:bg-tertiary/10"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
