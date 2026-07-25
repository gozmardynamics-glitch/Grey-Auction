'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Link2, UserPlus } from 'lucide-react';
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

  const handleRemoveParticipant = useCallback((participantId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(`https://greyauctions.com/room/${room.id}/invite`);
  }, [room.id]);

  const handleAuctionClick = useCallback((auction: BiddingRoomAuction) => {
    setSelectedAuction(auction);
    setAuctionDetailsOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{room.roomName}</h1>
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => setParticipantsOpen(true)}
          >
            {participants.length} Participant{participants.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleCopyInviteLink}>
            <Link2 className="h-4 w-4" />
            Invite Link
          </Button>
          <Button className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite Bidder
          </Button>
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
