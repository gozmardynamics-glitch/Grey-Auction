import { FileText, MapPin, ExternalLink } from 'lucide-react';
import type { AuctionDetail } from '../../../models';

interface LotSpecification {
  label: string;
  value: string;
}

interface AuctionDetailsGridProps {
  details: AuctionDetail[];
  specifications?: LotSpecification[];
  location?: {
    city: string;
    country: string;
    countryCode: string;
    address?: string;
  };
  lotId?: string;
  sellerName?: string;
  parentAuction?: {
    name: string;
    slug: string;
  };
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AuctionDetailsGrid({
  details,
  specifications,
  location,
  lotId,
  sellerName,
  parentAuction,
}: AuctionDetailsGridProps) {
  // Default specifications if none provided
  const specs = specifications || [
    { label: 'Brand', value: 'Audi' },
    { label: 'Type', value: 'RSQ8 Performance' },
    { label: 'Year of build', value: '2025' },
    { label: 'Mileage', value: '900 km' },
    { label: 'Fuel Type', value: 'Petrol' },
    { label: 'Transmission', value: 'Automatic' },
    { label: 'Color', value: 'White' },
    { label: 'Interior', value: 'Black' },
    { label: 'Engine', value: '4.0L V8 Twin-Turbo' },
    { label: 'Horsepower', value: '591 HP' },
    { label: 'Drive Type', value: 'AWD' },
    { label: 'Doors', value: '5' },
    { label: 'Seats', value: '5' },
    { label: 'VIN', value: 'WAUZZZ4M9PD000001' },
    { label: 'License Plate', value: '02-52-97' },
    { label: 'Emission Standard', value: 'Euro 6' },
  ];

  return (
    <div className="space-y-8">
      {/* Lot Specifications — Troostwijk-style */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
          <FileText className="h-4 w-4" />
          Lot Specifications
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-lg border border-border/50 bg-muted/30 p-6">
          {specs.map((spec) => (
            <div key={spec.label} className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground min-w-[140px]">
                {spec.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Location with Map Link */}
      {location && (
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCountryFlag(location.countryCode)}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {location.city}, {location.country}
                  </p>
                  {location.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {location.address}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${location.city}, ${location.country}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <ExternalLink className="h-3 w-3" />
                View on Map
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Seller & Lot Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {lotId && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Lot Number</p>
            <p className="text-sm font-bold text-foreground">{lotId}</p>
          </div>
        )}
        {sellerName && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Seller</p>
            <p className="text-sm font-bold text-foreground">{sellerName}</p>
          </div>
        )}
        {parentAuction && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Auction</p>
            <a
              href={`/auctions/${parentAuction.slug}`}
              className="text-sm font-bold text-primary hover:underline"
            >
              {parentAuction.name}
            </a>
          </div>
        )}
      </div>

      {/* Legacy details grid */}
      {details.length > 0 && (
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
            Additional Details
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground min-w-[140px]">
                  {detail.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
