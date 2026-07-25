'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Phone, Home, AlertTriangle } from 'lucide-react';

import {
  ActionSuccessDialog,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  ConfirmActionDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';
import { type BiddingRoom, type BiddingRoomAuction } from '../../models';
import ParticipantsModal from './participants_modal';
import { statusStyles } from '@/shared/utils/helpers';

// ---------- Helpers ----------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator />
      <h3 className="text-sm font-semibold">{children}</h3>
    </>
  );
}

function SellerDetailsCard({ room }: { room: BiddingRoom }) {
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
          <AvatarImage src={room.sellerAvatar} alt={room.seller} />
          <AvatarFallback>{room.seller.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{room.seller}</span>
            {room.sellerVerified && (
              <svg
                className="h-4 w-4 text-tertiary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
          {room.sellerEmail && (
            <p className="text-xs text-muted-foreground">{room.sellerEmail}</p>
          )}
        </div>
      </div>
      {room.sellerLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {room.sellerLocation}
        </div>
      )}
      {room.sellerPhone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          {room.sellerPhone}
        </div>
      )}
    </Card>
  );
}

function AuctionListItem({ auction }: { auction: BiddingRoomAuction }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {auction.image ? (
        <div className="relative h-10 w-12">
          <Image
            src={auction.image}
            alt={auction.name}
            fill
            className="rounded object-cover"
          />
        </div>
      ) : (
        <div className="flex h-10 w-12 items-center justify-center rounded bg-muted">
          <Home className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{auction.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Current Bid: {formatCurrency(auction.currentBid)}</span>
          <span>({auction.bids} bids)</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`text-xs ${statusStyles[auction.status] || ''}`}
      >
        {auction.status}
      </Badge>
    </div>
  );
}

// ---------- Right Column Variants ----------

function PendingRightColumn({ room }: { room: BiddingRoom }) {
  return (
    <>
      <SellerDetailsCard room={room} />

      {/* Auctions in this Room */}
      {room.auctionsList && room.auctionsList.length > 0 && (
        <Card className="space-y-3 bg-card p-2">
          <h3 className="text-sm font-semibold">Auctions in this Room</h3>
          <div className="space-y-2">
            {room.auctionsList.map((auction) => (
              <AuctionListItem key={auction.id} auction={auction} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function ActiveRightColumn({ room }: { room: BiddingRoom }) {
  return (
    <>
      <SellerDetailsCard room={room} />

      {/* Auctions in this Room */}
      {room.auctionsList && room.auctionsList.length > 0 && (
        <Card className="space-y-3 bg-card p-2">
          <h3 className="text-sm font-semibold">Auctions in this Room</h3>
          <div className="space-y-2">
            {room.auctionsList.map((auction) => (
              <AuctionListItem key={auction.id} auction={auction} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function RejectedRightColumn({ room }: { room: BiddingRoom }) {
  return (
    <>
      <SellerDetailsCard room={room} />

      {/* Rejection Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
        <p className="text-sm text-red-700">
          This bidding room has been rejected and will not go live. The seller
          has been notified with the reason for rejection.
        </p>
      </div>

      {/* Auctions in this Room */}
      {room.auctionsList && room.auctionsList.length > 0 && (
        <Card className="space-y-3 bg-card p-2">
          <h3 className="text-sm font-semibold">Auctions in this Room</h3>
          <div className="space-y-2">
            {room.auctionsList.map((auction) => (
              <AuctionListItem key={auction.id} auction={auction} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

// ---------- Props ----------

interface RoomDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: BiddingRoom | null;
}

// ---------- Main Component ----------

export default function RoomDetailsModal({
  open,
  onOpenChange,
  room,
}: RoomDetailsModalProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [successVariant, setSuccessVariant] = useState<
    'approved' | 'rejected' | null
  >(null);

  if (!room) return null;

  const isPending = room.status === 'Pending';
  const isActive = room.status === 'Active';
  const isCompleted = room.status === 'Completed';
  const isRejected = room.status === 'Rejected';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[60%] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="md:flex md:items-center md:justify-between">
              <DialogTitle className="text-lg font-semibold">
                Room Details
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
                    Approve Room
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
              {/* Room Header */}
              <Card className="flex gap-4 bg-card p-2">
                {room.roomImage ? (
                  <div className="relative h-16 w-20">
                    <Image
                      src={room.roomImage}
                      alt={room.name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-muted">
                    <Home className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {room.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusStyles[room.status]}
                    >
                      {room.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{room.name}</p>
                </div>
              </Card>

              {/* Room Information */}
              <SectionTitle>Room Information</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow label="Seller:" value={room.seller} />
                <InfoRow label="Auctions:" value={String(room.auctions)} />
                <InfoRow label="Bidders:" value={String(room.bidders)} />
                <InfoRow label="Start Date:" value={room.startDate || '-'} />
                <InfoRow label="End Date:" value={room.endDate || '-'} />
                <InfoRow label="Status:" value={room.status} />
              </Card>

              {/* Description */}
              {room.description && (
                <>
                  <SectionTitle>Description</SectionTitle>
                  <Card className="bg-card p-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {room.description}
                    </p>
                  </Card>
                </>
              )}

              {/* Participants Button */}
              {room.participants && room.participants.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setParticipantsOpen(true)}
                >
                  View Participants ({room.participants.length})
                </Button>
              )}
            </div>

            {/* ====== RIGHT COLUMN (status-dependent) ====== */}
            <div className="space-y-5">
              {isPending && <PendingRightColumn room={room} />}
              {(isActive || isCompleted) && <ActiveRightColumn room={room} />}
              {isRejected && <RejectedRightColumn room={room} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        variant="approve"
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Are you sure you want to approve this bidding room?"
        consequenceLabel="Once approved:"
        consequences={[
          'The bidding room will go live immediately',
          'All listed auctions will become active',
          'Registered bidders will be notified',
          'This action cannot be undone',
        ]}
        checkboxLabel="Please confirm that all room details and auction listings have been reviewed and meet platform requirements"
        confirmLabel="Approve Room"
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
        title="Are you sure you want to reject this bidding room?"
        consequenceLabel="This action will:"
        consequences={[
          'The bidding room will not go live',
          'The seller will be notified with the rejection reason',
          'The seller can resubmit after corrections',
          'This action cannot be undone',
        ]}
        textareaPlaceholder="e.g., Incomplete room details, policy violation, unverified seller..."
        confirmLabel="Reject Room"
        onConfirm={() => {
          setRejectOpen(false);
          onOpenChange(false);
          setSuccessVariant('rejected');
        }}
      />

      <ParticipantsModal
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        participants={room.participants || []}
      />

      {successVariant && (
        <ActionSuccessDialog
          open={!!successVariant}
          onOpenChange={() => setSuccessVariant(null)}
          variant={successVariant === 'approved' ? 'success' : 'error'}
          title={
            successVariant === 'approved'
              ? 'Bidding Room Approved'
              : 'Bidding Room Rejected'
          }
          message={
            successVariant === 'approved'
              ? 'The bidding room has been successfully approved and is now live. All listed auctions are active and registered bidders have been notified.'
              : 'The bidding room has been rejected. The seller has been notified with the reason for rejection and can resubmit after making corrections.'
          }
        />
      )}
    </>
  );
}
