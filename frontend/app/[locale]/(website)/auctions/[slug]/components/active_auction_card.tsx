'use client';

import { useState } from 'react';
import { useAppSelector } from '@/redux/store';
import {
  Button,
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/common';
import { ChevronRight, Info, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/helpers';

interface ActiveAuctionCardProps {
  bidType: string;
  onBidTypeChange: (value: string) => void;
  bidAmount: number;
  onBidAmountChange: (value: number) => void;
  onPlaceBid: () => void;
  onAutoBid: () => void;
  onBuyNow: () => void;
}

export default function ActiveAuctionCard({
  bidType,
  onBidTypeChange,
  bidAmount,
  onBidAmountChange,
  onPlaceBid,
  onAutoBid,
  onBuyNow,
}: ActiveAuctionCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const currentBid = useAppSelector((state) => state.bidding.currentBid);
  const bidError = useAppSelector((state) => state.bidding.bidError);
  const isBidding = useAppSelector((state) => state.bidding.isBidding);
  const autoBid = useAppSelector((state) => state.bidding.autoBid);
  const bidHistory = useAppSelector((state) => state.bidding.bidHistory);

  const auctionFee = currentBid * 0.19;
  const vatBid = 0;
  const vatFee = 0;
  const totalBid = currentBid + auctionFee + vatBid + vatFee;

  return (
    <Card className="space-y-4 p-4 shadow-none">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Your Bid:
        </p>
        <RadioGroup
          value={bidType}
          onValueChange={(value) => {
            onBidTypeChange(value);
            if (value === 'automatic' && bidAmount > currentBid) {
              onAutoBid();
            }
          }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="maximum" id="maximum" />
            <Label htmlFor="maximum" className="text-sm">
              Maximum Bid
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set the highest amount you&apos;re willing to bid. The system will bid on your behalf up to this limit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="automatic" id="automatic" />
            <Label htmlFor="automatic" className="text-sm">
              Monster/Automatic Bid
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Automatically outbid other bidders up to your maximum amount.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </RadioGroup>
      </div>

      {/* Bid Input + Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3"
            onClick={() =>
              onBidAmountChange(Math.max(0, bidAmount - 1000000))
            }
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
        <Button
          variant="default"
          size="lg"
          className="flex-1"
          onClick={onBuyNow}
        >
          Buy Now For &#8358;50M
        </Button>
      </div>

      {/* Error Display */}
      {bidError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{bidError}</p>
        </div>
      )}

      {/* Auto Bid Status */}
      {autoBid.enabled && (
        <div className="rounded-lg border border-tertiary/20 bg-green-50 p-3">
          <p className="text-sm text-green-600">
            Auto-bid enabled up to {formatCurrency(autoBid.maxAmount)}
          </p>
        </div>
      )}

      {/* Bid History */}
      {bidHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Recent Bids
          </h4>
          <div className="space-y-1">
            {bidHistory.slice(0, 3).map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {bid.bidderName}
                </span>
                <span className="font-medium">
                  {formatCurrency(bid.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Collapsible */}
      <Collapsible
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium">
          Breakdown
          <ChevronRight
            className={`h-4 w-4 transition-transform ${breakdownOpen ? 'rotate-90' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bid</span>
              <span>{formatCurrency(currentBid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Auction fee (19%)
              </span>
              <span>{formatCurrency(auctionFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                VAT on bid value
              </span>
              <span>{formatCurrency(vatBid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                VAT on auction fee
              </span>
              <span>{formatCurrency(vatFee)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total Bid Amount</span>
              <span>{formatCurrency(totalBid)}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
