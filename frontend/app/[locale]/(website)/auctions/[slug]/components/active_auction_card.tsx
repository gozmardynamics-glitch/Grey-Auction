'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import {
  Button,
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  PriceBreakdown,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/common';
import { ChevronRight, Info, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/helpers';
import { setAutoBid } from '@/redux/slices/bidding.slice';

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
  const dispatch = useAppDispatch();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMaxAmount, setAutoBidMaxAmount] = useState(0);
  const currentBid = useAppSelector((state) => state.bidding.currentBid);
  const bidError = useAppSelector((state) => state.bidding.bidError);
  const isBidding = useAppSelector((state) => state.bidding.isBidding);
  const autoBid = useAppSelector((state) => state.bidding.autoBid);
  const bidHistory = useAppSelector((state) => state.bidding.bidHistory);

  const handleSetAutoBid = () => {
    if (autoBidMaxAmount <= currentBid) {
      toast.error('Maximum bid must be higher than current bid');
      return;
    }
    dispatch(setAutoBid({ enabled: true, maxAmount: autoBidMaxAmount }));
    toast.success(`Auto-bid set for ${formatCurrency(autoBidMaxAmount)}`);
  };

  return (
    <Card className="space-y-4 p-4">
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

      {/* Auto-Bid Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-bid-switch" className="text-sm font-medium cursor-pointer">
          Enable Auto-Bidding
        </Label>
        <Switch
          id="auto-bid-switch"
          checked={autoBidEnabled}
          onCheckedChange={setAutoBidEnabled}
        />
      </div>

      {/* Auto-Bid Settings */}
      {autoBidEnabled && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="auto-bid-max" className="text-sm">
              Your Maximum Bid (&#8358;)
            </Label>
            <div className="mt-1.5 flex items-center gap-1 rounded-lg border px-3">
              <span className="text-sm text-muted-foreground">&#8358;</span>
              <Input
                id="auto-bid-max"
                type="number"
                value={autoBidMaxAmount || ''}
                onChange={(e) => setAutoBidMaxAmount(Number(e.target.value))}
                placeholder="Enter max bid"
                className="h-10 border-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-foreground">
              Bid Increments
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-1.5 text-left font-medium">Current Bid</th>
                  <th className="pb-1.5 text-right font-medium">Increment</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-1.5">&#8358;0 - &#8358;50,000</td>
                  <td className="py-1.5 text-right">&#8358;1,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">&#8358;50,001 - &#8358;500,000</td>
                  <td className="py-1.5 text-right">&#8358;5,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">&#8358;500,001 - &#8358;5,000,000</td>
                  <td className="py-1.5 text-right">&#8358;25,000</td>
                </tr>
                <tr>
                  <td className="py-1.5">&#8358;5,000,001+</td>
                  <td className="py-1.5 text-right">&#8358;100,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            We&apos;ll automatically bid for you up to your maximum
          </p>

          <Button
            variant="default"
            size="default"
            className="w-full"
            onClick={handleSetAutoBid}
          >
            Set Auto-Bid
          </Button>
        </div>
      )}

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
          <div className="mt-2 rounded-lg border p-4">
            <PriceBreakdown amount={bidAmount || currentBid} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
