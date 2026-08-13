'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Link2, UserPlus, Lock, Shield, Copy, Check } from 'lucide-react';
import { Badge, Button } from '@/shared/components/common';
import type { BiddingRoom, BiddingRoomAuction } from '../../models';
import AuctionCard from './auction_card';
import dynamic from 'next/dynamic';

const ParticipantsModal = dynamic(() => import('./participants_modal'));
const InviteBidderModal = dynamic(() => import('./invite_bidder_modal'));
const AuctionDetailsModal = dynamic(() => import('./auction_details_modal'));

interface RoomDetailProps {
  room: BiddingRoom;
  onBack: () => void;
}

export default function RoomDetail({ room, onBack }: RoomDetailProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participants, setParticipants] = useState(room.participants);
  const [selectedAuction, setSelectedAuction] = useState<BiddingRoomAuction | null>(null);
  const [auctionDetailsOpen, setAuctionDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRemoveParticipant = useCallback((participantId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}/invite`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [room.id]);

  const handleAuctionClick = useCallback((auction: BiddingRoomAuction) => {
    setSelectedAuction(auction);
    setAuctionDetailsOpen(true);
  }, []);

  const isPrivate = room.type === 'private' || room.roomType === 'private';

  return (
    <div className="space-y-6">
      {/* Exclusive Room Header */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{room.roomName}</h1>
                {isPrivate ? (
                  <Badge className="gap-1 bg-slate-800 text-white border-0">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isPrivate
                  ? 'Exclusive room — only invited bidders can participate'
                  : 'Open room — anyone can join and bid'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCopyInviteLink}>
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Invite Link'}
            </Button>
            <Button className="gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite Bidder
            </Button>
          </div>
        </div>

        {/* Room meta strip */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-primary/10 pt-4">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/5"
            onClick={() => setParticipantsOpen(true)}
          >
            {participants.length} Participant{participants.length !== 1 ? 's' : ''}
          </Badge>
          {room.requiresDeposit && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              Deposit required: {room.depositAmount}
            </span>
          )}
          {room.allowInviteCode && room.inviteCode && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Access code: <span className="font-mono font-semibold">{room.inviteCode}</span>
            </span>
          )}
        </div>
      </div>

      {/* Auction Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {room.auctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            onClick={() => handleAuctionClick(auction)}
          />
        ))}
      </div>

      {/* Participants Modal */}
      <ParticipantsModal
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        participants={participants}
        onRemove={handleRemoveParticipant}
      />

      {/* Invite Bidder Modal */}
      <InviteBidderModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roomName={room.roomName}
        roomId={room.id}
        productId={room.auctions[0]?.id}
      />

      {/* Auction Details Modal */}
      <AuctionDetailsModal
        open={auctionDetailsOpen}
        onOpenChange={setAuctionDetailsOpen}
        auction={selectedAuction}
      />
    </div>
  );
}
