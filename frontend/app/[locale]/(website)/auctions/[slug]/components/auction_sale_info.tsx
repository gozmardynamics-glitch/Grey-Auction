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
} from 'lucide-react';

export default function AuctionSaleInfo() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-foreground">
        Auction Sale Information
      </h2>
      <Card className="bg-primary/10 p-4 border-none">
        <CardContent className="space-y-4 p-5">
          {/* Seller */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                GA
              </div>
              <div>
                <p className="text-sm font-medium">Grey Automobile</p>
                <p className="text-xs text-muted-foreground">
                  greyautomobile@gmail.com
                </p>
              </div>
            </div>
            <Button variant="default" size="sm" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Send a Message</span>
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>Lagos, Nigeria</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Lot:</span>
              <span># 25896742</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sale Date:</span>
              <span>31st December, 2025 • 16:00 WAT</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Inspection Time:
              </span>
              <span>7th January, 2025 • 22:20 WAT</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Contact Details:
              </span>
              <span>
                Contact details will be shared on the invoice after payment
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
