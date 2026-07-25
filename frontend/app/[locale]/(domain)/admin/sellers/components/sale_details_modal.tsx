import Image from 'next/image';
import { BookCopy, Download, Hammer, MapPin, Phone } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  TypographyP,
  TypographySmall,
} from '@/shared/components/common';

import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { SaleDetail } from '../../models';

interface SaleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleDetail | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function SaleDetailsModal({
  open,
  onOpenChange,
  sale,
}: SaleDetailsModalProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Sale Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Sale Header */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold flex items-center gap-2">
              <div className="text-sm font-semibold flex items-center gap-1">
                <BookCopy size={12} />
                {sale.saleId}
              </div>

              <Badge
                variant="outline"
                className={`flex items-center gap-1 py-1 ${statusStyles[sale.status] || ''}`}
              >
                {sale.status}
              </Badge>
            </span>
            <Badge variant="outline" className="flex items-center gap-1 py-1">
              <Hammer />
              Type: {sale.type}
            </Badge>
          </div>

          {/* Item */}
          <Card className="flex items-center gap-3 border-dashed p-3">
            {sale.itemImage && (
              <div className="relative h-14 w-18">
                <Image
                  src={sale.itemImage}
                  alt={sale.item}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex flex-col space-y-1">
              <TypographySmall>{sale.saleId}</TypographySmall>
              <TypographyP>{sale.item}</TypographyP>
            </div>
          </Card>

          {/* Buyer Details */}
          <div className="space-y-3">
            <Card className="p-3 space-y-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Buyer Details</h3>
                <Button variant="outline" size="sm" className="bg-card">
                  View Profile
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={sale.buyer.avatar} alt={sale.buyer.name} />
                  <AvatarFallback>{sale.buyer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{sale.buyer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.buyer.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {sale.buyer.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {sale.buyer.phone}
                </div>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Breakdown */}
          <div className="space-y-0">
            <h3 className="text-sm font-semibold mb-2">Breakdown</h3>
            <Card className="py-3">
              <InfoRow
                label="Final Bid"
                value={formatCurrency(sale.totalBid)}
              />
              <Separator />
              <InfoRow
                label={`Auction Fee (${sale.auctionFeePercent}%)`}
                value={formatCurrency(sale.auctionFee)}
              />
              <Separator />
              <InfoRow
                label="VAT on bid value"
                value={formatCurrency(sale.vatOnBidValue)}
              />
              <Separator />
              <InfoRow
                label="VAT on auction fee"
                value={formatCurrency(sale.vatOnAuctionFee)}
              />
              <Separator />
              <InfoRow
                label="Total Bid Amount"
                value={formatCurrency(sale.totalBidAmount)}
              />
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
