import { FileText, AlertTriangle, Scale, Download } from 'lucide-react';
import { Button } from '@/shared/components/common';
import ProductDetailsTabs from '../tabs';

interface AuctionDescription {
  about: string;
  mechanical: string[];
}

interface ProductTabsContentProps {
  description?: AuctionDescription;
}

const defaultDescription: AuctionDescription = {
  about:
    'Introducing the Audi RSQ8, a masterpiece in automotive engineering, featuring a stunning white exterior and a sleek black interior. Transmission enthusiasts will be delighted by the 6-speed manual gearbox, offering a direct connection to the road. The odometer proudly displays just around 900 miles, a testament to the care this vehicle has received.',
  mechanical: [
    'Fuel Safe 22-gallon fuel cell',
    'Ron Davis 4-core radiator',
    'Ultra Pro oil cooler with fan pack on transmission and differential',
    'Power-assisted rack and pinion steering',
    'KRC power steering cooler',
    'KRC steering pump',
  ],
};

export default function ProductTabsContent({
  description = defaultDescription,
}: ProductTabsContentProps) {
  const tabs = [
    {
      value: 'description',
      label: 'Description',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              About This Item
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {description.about}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Mechanical Details
            </h3>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
              {description.mechanical.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      ),
    },
    {
      value: 'additional',
      label: 'Additional Information',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Condition</p>
              <p className="text-sm text-foreground">Used — Good condition, well maintained</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Warranty</p>
              <p className="text-sm text-foreground">No warranty — Sold as-is</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Payment Terms</p>
              <p className="text-sm text-foreground">Full payment within 48 hours of auction close</p>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Delivery</p>
              <p className="text-sm text-foreground">Collection only — Buyer responsible for transport</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'terms',
      label: 'Terms & Conditions',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Terms & Conditions of Sale</h3>
          </div>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">1. Bidding</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All bids are binding and cannot be retracted once placed</li>
                <li>The highest bidder at auction close wins the item</li>
                <li>Grey Auction reserves the right to reject any bid</li>
                <li>Minimum bid increments apply as displayed on the bid form</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">2. Payment</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Full payment must be received within 48 hours of auction close</li>
                <li>Accepted methods: Bank transfer, Flutterwave, Paystack</li>
                <li>A buyer&apos;s premium of 10% applies to the winning bid amount</li>
                <li>Items remain the property of the seller until full payment is received</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">3. Collection & Delivery</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Items must be collected on the scheduled collection date</li>
                <li>Storage fees of ₦5,000/day apply for late collection</li>
                <li>Buyer is responsible for loading and transportation</li>
                <li>Items must be inspected before removal — no claims after collection</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">4. Liability</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Grey Auction acts as an intermediary between buyer and seller</li>
                <li>Items are sold &quot;as-is&quot; without warranty unless stated otherwise</li>
                <li>Buyers are responsible for verifying item condition before bidding</li>
                <li>Grey Auction is not liable for any defects or discrepancies</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'document',
      label: 'Documents',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Available Documents</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Vehicle Registration Certificate</p>
                  <p className="text-xs text-muted-foreground">PDF &bull; 2.4 MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Inspection Report</p>
                  <p className="text-xs text-muted-foreground">PDF &bull; 1.8 MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Service History</p>
                  <p className="text-xs text-muted-foreground">PDF &bull; 3.1 MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Documents are provided for reference only. Buyers are responsible for verifying all information before bidding.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return <ProductDetailsTabs tabs={tabs} />;
}
