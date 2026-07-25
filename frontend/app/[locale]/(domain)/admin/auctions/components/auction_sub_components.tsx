import { MapPin, Phone } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  Separator,
} from '@/shared/components/common';
import { type AuctionDetail } from './auction_details_data';

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator />
      <h3 className="text-sm font-semibold">{children}</h3>
    </>
  );
}

export function SellerDetailsCard({ auction }: { auction: AuctionDetail }) {
  return (
    <Card className="rounded-lg border space-y-4 bg-card p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Seller Details</h3>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          View Profile
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={auction.sellerAvatar} alt={auction.seller} />
          <AvatarFallback>{auction.seller.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{auction.seller}</span>
            {auction.sellerVerified && (
              <svg
                className="h-4 w-4 text-tertiary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
          {auction.sellerEmail && (
            <p className="text-xs text-muted-foreground">
              {auction.sellerEmail}
            </p>
          )}
        </div>
      </div>
      {auction.sellerLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {auction.sellerLocation}
        </div>
      )}
      {auction.sellerPhone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          {auction.sellerPhone}
        </div>
      )}
    </Card>
  );
}
