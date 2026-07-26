'use client';

import { useAppSelector } from '@/redux/store';
import { Button, Card, Input } from '@/shared/components/common';
import { Minus, Plus, Radio } from 'lucide-react';
import BidHistoryTable from './bid_history_table';

interface LiveAuctionCardProps {
  bidAmount: number;
  onBidAmountChange: (value: number) => void;
  onPlaceBid: () => void;
}

export default function LiveAuctionCard({
  bidAmount,
  onBidAmountChange,
  onPlaceBid,
}: LiveAuctionCardProps) {
  const timeLeft = useAppSelector((state) => state.bidding.timeLeft);
  const bidError = useAppSelector((state) => state.bidding.bidError);
  const isBidding = useAppSelector((state) => state.bidding.isBidding);
  const currentBid = useAppSelector((state) => state.bidding.currentBid);

  const timeComponents = {
    mins: Math.floor((timeLeft % (60 * 60)) / 60),
    secs: timeLeft % 60,
  };

  return (
    <Card className="space-y-4 bg-tertiary/10 p-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full text-xs bg-tertiary text-primary-foreground px-3 py-1">
          <Radio size={15} />
          <span className="font-semibold">Live Auction In Progress</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Time Left:{' '}
          <span className="font-semibold text-primary">
            {String(timeComponents.mins).padStart(2, '0')} Mins
          </span>{' '}
          :{' '}
          <span className="font-semibold text-primary">
            {String(timeComponents.secs).padStart(2, '0')} Secs
          </span>
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Preliminary bidding is now closed. Place a bid now to win this auction.
      </p>

      {/* Bid Input + Place Bid */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border bg-background">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3"
            onClick={() => onBidAmountChange(Math.max(0, bidAmount - 1000000))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm text-muted-foreground">&#8358;</span>
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => onBidAmountChange(Number(e.target.value))}
              className="h-10 w-24 border-0 text-center shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3"
            onClick={() => onBidAmountChange(bidAmount + 1000000)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="default"
          size="lg"
          className="flex-1"
          onClick={onPlaceBid}
          disabled={isBidding || bidAmount <= currentBid}
        >
          {isBidding ? 'Placing Bid...' : 'Place Bid'}
        </Button>
      </div>

      {/* Error Display */}
      {bidError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{bidError}</p>
        </div>
      )}

      {/* Bid History */}
      <BidHistoryTable variant="inline" />
    </Card>
  );
}
