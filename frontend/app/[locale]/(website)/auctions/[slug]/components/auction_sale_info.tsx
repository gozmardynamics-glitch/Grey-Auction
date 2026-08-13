import {
  Button,
  Card,
  CardContent,
  Separator,
} from '@/shared/components/common';
import {
  MapPin,
  Tag,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Truck,
  Eye,
  Shield,
  AlertTriangle,
  Gavel,
  HelpCircle,
  Leaf,
} from 'lucide-react';

export default function AuctionSaleInfo() {
  return (
    <div className="space-y-6">
      {/* Seller Info Card */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
          <Gavel className="h-4 w-4" />
          Sale Information
        </div>
        <Card className="border border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Seller header */}
            <div className="flex items-center justify-between bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  GA
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Grey Automobile</p>
                  <p className="text-xs text-muted-foreground">Verified Seller</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Message</span>
              </Button>
            </div>

            {/* Sale details */}
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Lot:</span>
                <span className="font-medium"># 25896742</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Sale Date:</span>
                <span className="font-medium">31st December, 2025 &bull; 16:00 WAT</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Inspection:</span>
                <span className="font-medium">7th January, 2025 &bull; 22:20 WAT</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Contact:</span>
                <span className="text-xs">Shared on invoice after payment</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection/Pickup Section */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
          <Truck className="h-4 w-4" />
          Collection
        </div>
        <Card className="border border-border/50">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No 5, Ijele Street, Victoria Island, Lagos</p>
                <p className="text-xs text-muted-foreground">Nigeria</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Collection Date</p>
                <p className="text-xs text-muted-foreground">To be announced after auction closes</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  Collection dates cannot be changed. Storage fees of ₦5,000/day apply if items are not collected on the scheduled date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Viewings Section */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
          <Eye className="h-4 w-4" />
          Viewings
        </div>
        <Card className="border border-border/50">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No 5, Ijele Street, Victoria Island, Lagos</p>
                <p className="text-xs text-muted-foreground">Nigeria</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Viewing Date</p>
                <p className="text-xs text-muted-foreground">Contact seller to arrange viewing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Information */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white">
          <Shield className="h-4 w-4" />
          Legal Information
        </div>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                No warranty applicable unless stated otherwise
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Right of withdrawal applies to consumers per Nigerian consumer protection law
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Grey Auction acts as an intermediary platform between buyer and seller
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                All bids are binding once the auction closes
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CO2 Savings Badge */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Leaf className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Sustainable Choice</p>
            <p className="text-xs text-green-700">
              Purchasing pre-owned items saves approximately <span className="font-bold">2,450 kg CO₂e</span> compared to buying new.
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Have questions?</p>
            <a href="/faq" className="text-xs text-primary hover:underline">
              Visit our Help center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
