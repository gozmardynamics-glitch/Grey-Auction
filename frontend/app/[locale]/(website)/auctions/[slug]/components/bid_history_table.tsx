'use client';

import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/shared/utils/helpers';

interface BidHistoryTableProps {
  variant: 'inline' | 'summary';
}

export default function BidHistoryTable({ variant }: BidHistoryTableProps) {
  const bidHistory = useAppSelector((state) => state.bidding.bidHistory);
  const authUser = useAppSelector((state) => state.auth.user);

  if (variant === 'inline') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          Bid History
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr>
                <th className="border px-4 py-2 text-start font-medium text-muted-foreground" />
                <th className="border px-4 py-2 text-start font-medium text-muted-foreground">
                  Bid
                </th>
                <th className="border px-4 py-2 text-start font-medium text-muted-foreground">
                  Date
                </th>
                <th className="border px-4 py-2 text-start font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bidHistory.map((bid, idx) => (
                <tr key={bid.id}>
                  <td className="border px-4 py-2">
                    {bid.bidderId === (authUser?.id ?? '')
                      ? 'You'
                      : String(idx + 1)}
                  </td>
                  <td className="border px-4 py-2">
                    {formatCurrency(bid.amount)}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(bid.timestamp).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}{' '}
                    •{' '}
                    {new Date(bid.timestamp).toLocaleTimeString(
                      'en-US',
                      {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {idx === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Winning
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  className="border px-4 py-2 font-medium"
                  colSpan={2}
                >
                  Auction Started
                </td>
                <td className="border px-4 py-2" colSpan={2}>
                  January 7, 2026 • 11:43 AM
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Summary variant — used in the bottom section
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-start text-sm font-medium text-muted-foreground whitespace-nowrap">
              Date
            </th>
            <th className="border px-4 py-2 text-start text-sm font-medium text-muted-foreground">
              Bids
            </th>
            <th className="border px-4 py-2 text-start text-sm font-medium text-muted-foreground">
              Bidders
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2 text-sm">
              December 19, 2025 • 2:18 PM
            </td>
            <td className="border px-4 py-2 text-sm">₦35,000,000</td>
            <td className="border px-4 py-2 text-sm">2</td>
          </tr>
          <tr>
            <td className="border px-4 py-2 text-sm">
              December 19, 2025 • 2:18 PM
            </td>
            <td className="border px-4 py-2 text-sm">₦35,000,000</td>
            <td className="border px-4 py-2 text-sm">2</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
