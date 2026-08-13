'use client';

import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/shared/utils/helpers';
import { Gavel, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface BidHistoryTableProps {
  variant: 'inline' | 'summary';
}

export default function BidHistoryTable({ variant }: BidHistoryTableProps) {
  const bidHistory = useAppSelector((state) => state.bidding.bidHistory);
  const authUser = useAppSelector((state) => state.auth.user);
  const [showAll, setShowAll] = useState(false);

  // Anonymous bidder mapping (Troostwijk-style numbered badges)
  const getBidderDisplay = (bidderId: string, idx: number) => {
    if (bidderId === (authUser?.id ?? '')) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            You
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
          {idx + 1}
        </span>
        <span className="text-xs text-muted-foreground">Bidder #{idx + 1}</span>
      </span>
    );
  };

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            Bid History
          </h4>
          <span className="text-xs text-muted-foreground">
            {bidHistory.length} bid{bidHistory.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                  Bidder
                </th>
                <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                  Date
                </th>
                <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bidHistory.slice(0, showAll ? undefined : 5).map((bid, idx) => (
                <tr key={bid.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    {getBidderDisplay(bid.bidderId, idx)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">
                    {formatCurrency(bid.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(bid.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    &bull;{' '}
                    {new Date(bid.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {idx === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Winning
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bidHistory.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mx-auto"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Show less' : `View all ${bidHistory.length} bids`}
          </button>
        )}
      </div>
    );
  }

  // Summary variant — used in the bottom section
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Gavel className="h-4 w-4 text-primary" />
          Recent Bids
        </h4>
        <span className="text-xs text-muted-foreground">
          {bidHistory.length} bid{bidHistory.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs whitespace-nowrap">
                Date
              </th>
              <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                Amount
              </th>
              <th className="px-4 py-2.5 text-start font-medium text-muted-foreground text-xs">
                Bidder
              </th>
            </tr>
          </thead>
          <tbody>
            {bidHistory.slice(0, 3).map((bid, idx) => (
              <tr key={bid.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(bid.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  &bull;{' '}
                  {new Date(bid.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </td>
                <td className="px-4 py-2.5 font-semibold text-foreground">
                  {formatCurrency(bid.amount)}
                </td>
                <td className="px-4 py-2.5">
                  {getBidderDisplay(bid.bidderId, idx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bidHistory.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mx-auto"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {showAll ? 'Show less' : `View all ${bidHistory.length} bids`}
        </button>
      )}
    </div>
  );
}
