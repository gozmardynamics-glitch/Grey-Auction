import { Badge, EmptyState } from '@/shared/components/common';
import { Gavel } from 'lucide-react';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { buyerAuctions } from '../../models/data';

export default function BuyerAuctionsModule() {
  return (
    <div className="space-y-6 p-6">
      <h3 className="text-base font-semibold">My Auctions</h3>

      {buyerAuctions.length === 0 ? (
        <EmptyState
          icon={<Gavel className="h-10 w-10" />}
          title="No Auctions Yet"
          description="Auctions you've participated in will appear here."
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Auction ID</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Seller</th>
                <th className="px-4 py-2">Your Bid</th>
                <th className="px-4 py-2">Current Bid</th>
                <th className="px-4 py-2">End Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {buyerAuctions.map((auction) => (
                <tr key={auction.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {auction.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{auction.item}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {auction.seller}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(auction.yourBid)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(auction.currentBid)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {auction.endDate}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={statusStyles[auction.status]}
                    >
                      {auction.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
