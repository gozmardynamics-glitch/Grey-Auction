'use client';

import { useState } from 'react';
import { useAppSelector } from '@/redux/store';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  PriceBreakdown,
  Separator,
} from '@/shared/components/common';

interface PlaceBidModalProps {
  open: boolean;
  onClose: () => void;
  bidAmount: number;
  auctionId: string;
  auctionTitle?: string;
  onConfirm: () => void;
  bidModalStep: 'confirm' | 'success';
}

export default function PlaceBidModal({
  open,
  onClose,
  bidAmount,
  auctionId,
  auctionTitle,
  onConfirm,
  bidModalStep,
}: PlaceBidModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isBidding = useAppSelector((state) => state.bidding.isBidding);
  const currentBid = useAppSelector((state) => state.bidding.currentBid);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {bidModalStep === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle>Place a Bid</DialogTitle>
            </DialogHeader>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">#{auctionId}</p>
              <p className="text-sm font-semibold text-foreground">
                {auctionTitle || 'This lot'}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Breakdown</h4>
              <PriceBreakdown amount={bidAmount || currentBid} />
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <span>
                Bid is binding. By confirming, you agree to our{' '}
                <a href="#" className="text-primary underline">terms & conditions</a>{' '}
                to purchase this item if you win.
              </span>
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={!termsAccepted || isBidding}
              >
                {isBidding ? 'Confirming...' : 'Confirm Bid'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">Your Bid is Winning</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              You have successfully placed a bid on {auctionTitle || 'this lot'}.
              We&apos;ll notify you if you get outbid or if you win the auction.
            </p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
