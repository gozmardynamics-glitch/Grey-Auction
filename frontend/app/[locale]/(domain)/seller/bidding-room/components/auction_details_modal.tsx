'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  ScrollArea,
} from '@/shared/components/common';
import type { BiddingRoomAuction } from '../../models';
import AuctionDetailsContent from './auction_details_content';

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: BiddingRoomAuction | null;
}

export default function AuctionDetailsModal({
  open,
  onOpenChange,
  auction,
}: AuctionDetailsModalProps) {
  if (!auction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogTitle className="sr-only">Auction details</DialogTitle>
        <ScrollArea className="max-h-[80vh]">
          <div className="p-6">
            <AuctionDetailsContent auction={auction} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
