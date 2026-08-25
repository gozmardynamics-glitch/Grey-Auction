'use client';

import Image from 'next/image';
import { Download, Hammer, MapPin, Phone } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Sale } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

interface ReceiptModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptModal({
  sale,
  open,
  onOpenChange,
}: ReceiptModalProps) {
  if (!sale) return null;

  const finalBid = sale.price;
  const auctionFeeRate = 0.19;
  const auctionFee = finalBid * auctionFeeRate;
  const vatOnBid = 0;
  const vatOnFee = 0;
  const totalBidAmount = finalBid + auctionFee + vatOnBid + vatOnFee;

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDownloadReceipt = () => {
    // Replace with actual download logic
    
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[40%] gap-0 p-6 space-y-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Receipt</DialogTitle>
        </DialogHeader>

        {/* Sale ID, Status, Type */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{sale.saleId}</span>
            <Badge
              variant="secondary"
              className={cn('font-medium', statusStyles[sale.status])}
            >
              {sale.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-lg p-2">
            <Hammer className="h-3.5 w-3.5" />
            Type: {sale.type}
          </div>
        </div>


        {/* Item Details */}
        <div className="flex items-center gap-4 py-4 border p-4 rounded-lg border-dashed">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted">
            <Image
              src={sale.item.image}
              alt={sale.item.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">#{sale.id}</p>
            <p className="text-sm font-medium">{sale.item.name}</p>
          </div>
        </div>


        {/* Buyer Details */}
        <div className="space-y-3 border p-4 rounded-lg">
          <h3 className="text-sm font-semibold">Buyer Details</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                  {sale.buyer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{sale.buyer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sale.buyer.name ?? 'adewalemayowa97@gmail.com'}
                </p>
              </div>
            </div>
            <Button variant="default" size="sm">
              Send a Message
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {sale.buyer.location ?? 'Lagos, Nigeria'}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {sale.buyer.phone ?? '+2348143601064'}
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Breakdown</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span>Final Bid</span>
              <span>{formatCurrency(finalBid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Auction fee ({(auctionFeeRate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(auctionFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>VAT on bid value</span>
              <span>{formatCurrency(vatOnBid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>VAT on auction fee</span>
              <span>{formatCurrency(vatOnFee)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total Bid Amount</span>
              <span>{formatCurrency(totalBidAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownloadReceipt} className="gap-2">
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
