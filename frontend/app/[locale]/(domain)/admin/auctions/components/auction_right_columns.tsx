'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import Image from 'next/image';
import {
  type AuctionDetail,
  formatCurrency,
  DUMMY_SPECS,
  DUMMY_DESCRIPTION,
  DUMMY_MECHANICAL,
  DUMMY_BID_HISTORY,
} from './auction_details_data';
import { statusStyles } from '@/shared/utils/helpers';
import { SellerDetailsCard } from './auction_sub_components';
import { SpecificationsDialog, DescriptionDialog } from './dialogs';

export function PendingRightColumn({ auction }: { auction: AuctionDetail }) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [additionalOpen, setAdditionalOpen] = useState(false);

  const specs = auction.specifications ?? DUMMY_SPECS;
  const description = auction.description ?? DUMMY_DESCRIPTION;
  const mechanical = auction.descriptionMechanical ?? DUMMY_MECHANICAL;
  const images =
    auction.productImages ??
    Array(8).fill(auction.itemImage || '/images/audi-rsq8.png');

  const detailItems = [
    { label: 'Specifications', onClick: () => setSpecsOpen(true) },
    { label: 'Description', onClick: () => setDescriptionOpen(true) },
    { label: 'Additional Information', onClick: () => setAdditionalOpen(true) },
  ];

  return (
    <>
      <SellerDetailsCard auction={auction} />

      {/* Product Images */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Product Images</h3>
        <div className="grid grid-cols-4 gap-2 relative">
          {images.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt={`Product ${index + 1}`}
              fill
              className="h-20 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </div>

      {/* Other Details - Clickable rows */}
      <Card className="space-y-3 bg-card p-2">
        <h3 className="text-sm font-semibold">Other Details</h3>
        <div className="space-y-2">
          {detailItems.map(({ label, onClick }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              onClick={onClick}
              className="flex w-full items-center justify-between rounded-lg border p-3 h-auto hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </Card>

      {/* Detail Dialogs */}
      <SpecificationsDialog
        open={specsOpen}
        onOpenChange={setSpecsOpen}
        specs={specs}
      />
      <DescriptionDialog
        open={descriptionOpen}
        onOpenChange={setDescriptionOpen}
        title="Description"
        description={description}
        mechanical={mechanical}
      />
      <DescriptionDialog
        open={additionalOpen}
        onOpenChange={setAdditionalOpen}
        title="Additional Information"
        description={auction.additionalInfo ?? description}
        mechanical={auction.additionalInfoMechanical ?? mechanical}
      />
    </>
  );
}

export function CompletedRightColumn({ auction }: { auction: AuctionDetail }) {
  const bidHistory = auction.bidHistory ?? DUMMY_BID_HISTORY;
  const totalBids = auction.totalBids ?? bidHistory.length;

  return (
    <>
      <SellerDetailsCard auction={auction} />

      {/* Other Details status bars */}
      <Card className="space-y-3 bg-card p-2">
        <h3 className="text-sm font-semibold">Other Details</h3>
        <div className="space-y-2">
          {['Payment', 'Inspection', 'Delivery'].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm font-medium">{label}</span>
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-200"
              >
                Completed
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Bid History */}
      <Card className="space-y-3 bg-card p-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bid History</h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Bids: {String(totalBids).padStart(2, '0')}
          </span>
        </div>
        {bidHistory.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Bidder</TableHead>
                  <TableHead className="text-xs">Bid Amount</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bidHistory.map((bid, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-medium">
                      {bid.bidder}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatCurrency(bid.bidAmount)}
                    </TableCell>
                    <TableCell className="text-xs">{bid.type}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {bid.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusStyles[bid.status] || ''}`}
                      >
                        {bid.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No bids placed yet.</p>
        )}
      </Card>
    </>
  );
}

export function RejectedRightColumn({ auction }: { auction: AuctionDetail }) {
  return (
    <>
      <SellerDetailsCard auction={auction} />

      {/* Rejection Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
        <p className="text-sm text-red-700">
          This item is not permitted for auction on our platform based on our
          policies.
        </p>
      </div>
    </>
  );
}
