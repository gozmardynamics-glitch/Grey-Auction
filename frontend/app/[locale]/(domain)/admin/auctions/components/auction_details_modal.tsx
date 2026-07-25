'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

import {
  ActionSuccessDialog,
  Badge,
  Button,
  Card,
  ConfirmActionDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';
import Image from 'next/image';
import { type AuctionDetail, formatCurrency } from './auction_details_data';
import { statusStyles } from '@/shared/utils/helpers';
import { InfoRow, SectionTitle } from './auction_sub_components';
import {
  PendingRightColumn,
  CompletedRightColumn,
  RejectedRightColumn,
} from './auction_right_columns';

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: AuctionDetail | null;
}

export default function AuctionDetailsModal({
  open,
  onOpenChange,
  auction,
}: AuctionDetailsModalProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [successVariant, setSuccessVariant] = useState<
    'approved' | 'rejected' | null
  >(null);

  if (!auction) return null;

  const isPending = auction.status === 'Pending' || auction.status === 'Active';
  const isCompleted = auction.status === 'Completed';
  const isRejected = auction.status === 'Rejected';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[60%] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="md:flex md:items-center md:justify-between">
              <DialogTitle className="text-lg font-semibold">
                Auction Details
              </DialogTitle>
              {isPending && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectOpen(true)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-primary-foreground"
                    onClick={() => setApproveOpen(true)}
                  >
                    Approve Auction
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 p-6 pt-4 lg:grid-cols-2">
            {/* ====== LEFT COLUMN ====== */}
            <div className="space-y-5">
              {/* Item Header */}
              <Card className="flex gap-4 bg-card p-2">
                <div className="relative">
                  {auction.itemImage && (
                    <Image
                      src={auction.itemImage}
                      alt={auction.item}
                      fill
                      className="h-16 w-20 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {auction.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusStyles[auction.status]}
                    >
                      {auction.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{auction.item}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {auction.sellerReserveNotYetMet && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Seller Reserve Not Yet Met
                      </span>
                    )}
                    {auction.saleStatus && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Sale Status: {auction.saleStatus}
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Auction Information */}
              <SectionTitle>Auction Information</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow label="Category:" value={auction.category} />
                <InfoRow label="Duration:" value={auction.duration || '-'} />
                <InfoRow label="Start Date:" value={auction.startDate || '-'} />
                <InfoRow label="End Date:" value={auction.endDate} />
              </Card>

              {/* Bid Information */}
              <SectionTitle>Bid Information</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow
                  label="Starting Price:"
                  value={
                    auction.startingPrice
                      ? formatCurrency(auction.startingPrice)
                      : formatCurrency(auction.startingBid)
                  }
                />
                <InfoRow
                  label="Bid Increment:"
                  value={
                    auction.bidIncrement
                      ? formatCurrency(auction.bidIncrement)
                      : '-'
                  }
                />
                <InfoRow
                  label="Reserve Price:"
                  value={auction.reservePrice || '-'}
                />
                <InfoRow
                  label="Reserve Price @:"
                  value={
                    auction.reservePriceAmount
                      ? formatCurrency(auction.reservePriceAmount)
                      : '-'
                  }
                />
                <InfoRow
                  label="Allow Buy Now:"
                  value={auction.allowBuyNow || '-'}
                />
                <InfoRow
                  label="Buy Now @:"
                  value={
                    auction.buyNowPrice
                      ? formatCurrency(auction.buyNowPrice)
                      : '-'
                  }
                />
              </Card>

              {/* Inspection Information */}
              <SectionTitle>Inspection Information</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow
                  label="Allow Inspection:"
                  value={auction.allowInspection || '-'}
                />
                <InfoRow
                  label="Duration:"
                  value={auction.inspectionDuration || '-'}
                />
              </Card>
              {auction.inspectionAddress && (
                <Card className="space-y-1 bg-card p-2">
                  <p className="text-sm text-muted-foreground">
                    Inspection Address:
                  </p>
                  <p className="text-sm font-medium">
                    {auction.inspectionAddress}
                  </p>
                </Card>
              )}
            </div>

            {/* ====== RIGHT COLUMN (status-dependent) ====== */}
            <div className="space-y-5">
              {isPending && <PendingRightColumn auction={auction} />}
              {isCompleted && <CompletedRightColumn auction={auction} />}
              {isRejected && <RejectedRightColumn auction={auction} />}
              {auction.status === 'Flagged' && (
                <CompletedRightColumn auction={auction} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        variant="approve"
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Are you sure you want to approve this auction?"
        consequenceLabel="Once approved:"
        consequences={[
          'The auction will go live immediately',
          'The bidding period will begin',
          'Buyers will be able to participate',
          'Final Bids cannot be undone',
        ]}
        checkboxLabel="Please confirm that all auction details and item specifications have been reviewed and meet platform requirements"
        confirmLabel="Approve Auction"
        onConfirm={() => {
          setApproveOpen(false);
          onOpenChange(false);
          setSuccessVariant('approved');
        }}
      />

      <ConfirmActionDialog
        variant="reject"
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Are you sure you want to reject this auction?"
        consequenceLabel="This action will:"
        consequences={[
          'Prevent the auction from going live',
          'Notify the seller with the rejection reason',
          'Require the seller to resubmit the listing if they want to try again',
          'This action cannot be undone',
        ]}
        textareaPlaceholder="e.g., Misclassified/policy, policy violation, incorrect pricing..."
        confirmLabel="Reject Auction"
        onConfirm={() => {
          setRejectOpen(false);
          onOpenChange(false);
          setSuccessVariant('rejected');
        }}
      />

      {successVariant && (
        <ActionSuccessDialog
          open={!!successVariant}
          onOpenChange={() => setSuccessVariant(null)}
          variant={successVariant === 'approved' ? 'success' : 'error'}
          title={
            successVariant === 'approved'
              ? 'Auction Approved'
              : 'Auction Rejected'
          }
          message={
            successVariant === 'approved'
              ? 'The auction has been successfully approved and is now active. Bidding has started and users can place bids immediately.'
              : 'The auction has been rejected successfully. The seller has been notified with the reason for rejection.'
          }
        />
      )}
    </>
  );
}
