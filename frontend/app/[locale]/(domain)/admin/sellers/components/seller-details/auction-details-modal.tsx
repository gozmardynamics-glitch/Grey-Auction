import Image from 'next/image';
import { Check, MapPin, Phone, X } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';

import { AuctionDetail } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: AuctionDetail | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function AuctionDetailsModal({
  open,
  onOpenChange,
  auction,
}: AuctionDetailsModalProps) {
  if (!auction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Auction Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-4">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Auction Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Auction Information</h3>
              <InfoRow label="Auction ID" value={auction.auctionId} />
              <Separator />
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-muted-foreground">Item</p>
                <div className="flex items-center gap-2">
                  {auction.itemImage && (
                    <Image
                      src={auction.itemImage}
                      alt={auction.item}
                      className="h-8 w-10 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium">{auction.item}</span>
                </div>
              </div>
              <Separator />
              <InfoRow label="Category" value={auction.category} />
              <Separator />
              <InfoRow label="Duration" value={auction.duration} />
              <Separator />
              <InfoRow label="Start Date" value={auction.startDate} />
              <Separator />
              <InfoRow label="End Date" value={auction.endDate} />
            </div>

            <Separator />

            {/* Bid Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Bid Information</h3>
              <InfoRow
                label="Starting Price"
                value={formatCurrency(auction.startingPrice)}
              />
              <Separator />
              <InfoRow
                label="Bid Increment"
                value={formatCurrency(auction.bidIncrement)}
              />
              <Separator />
              <InfoRow
                label="Reserve Price"
                value={formatCurrency(auction.reservePrice)}
              />
              <Separator />
              <InfoRow
                label="Minimum Bid Price"
                value={formatCurrency(auction.minimumBidPrice)}
              />
              <Separator />
              <InfoRow
                label="Allow Buy Now"
                value={auction.allowBuyNow ? 'Yes' : 'No'}
              />
              <Separator />
              <InfoRow
                label="Buy Now Price"
                value={formatCurrency(auction.buyNowPrice)}
              />
            </div>

            <Separator />

            {/* Inspection Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Inspection Information</h3>
              <InfoRow
                label="Allow Inspection"
                value={auction.allowInspection ? 'Yes' : 'No'}
              />
              <Separator />
              <InfoRow
                label="Inspection Duration"
                value={auction.inspectionDuration}
              />
              <Separator />
              <InfoRow
                label="Inspection Address"
                value={auction.inspectionAddress}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Seller Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Seller Details</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={auction.seller.avatar} alt={auction.seller.name} />
                    <AvatarFallback>{auction.seller.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {auction.seller.name}
                      </p>
                      {auction.seller.verified && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-tertiary/10 text-tertiary-1 border-tertiary/20"
                        >
                          Verified
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                      >
                        {auction.seller.sellerType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {auction.seller.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {auction.seller.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {auction.seller.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Bid History</h3>
              {auction.bidHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No bids yet.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-background">
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Bid Amount</TableHead>
                        <TableHead className="text-xs">Timestamp</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auction.bidHistory.map((bid, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={bid.avatar} alt={bid.name} />
                                <AvatarFallback className="text-xs">{bid.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{bid.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatCurrency(bid.amount)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {bid.timestamp}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusStyles[bid.status] || ''}`}
                            >
                              {bid.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bid.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-tertiary-1 hover:bg-tertiary/10"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
