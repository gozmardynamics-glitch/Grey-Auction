import type { AuctionDetail } from '../../../models';

interface AuctionDetailsGridProps {
  details: AuctionDetail[];
}

export default function AuctionDetailsGrid({ details }: AuctionDetailsGridProps) {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-foreground">
        Auction Details
      </h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {details.map((detail) => (
          <div key={detail.label} className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {detail.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
