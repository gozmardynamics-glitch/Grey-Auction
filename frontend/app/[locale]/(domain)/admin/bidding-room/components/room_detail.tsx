'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Badge, Button } from '@/shared/components/common';
import { statusStyles } from '@/shared/utils/helpers';
import type { BiddingRoom, BiddingRoomAuction } from '../../models';
import AuctionCard from './auction_card';
import dynamic from 'next/dynamic';

const ParticipantsModal = dynamic(() => import('./participants_modal'));
const AuctionDetailsModal = dynamic(() => import('./auction_details_modal'));

interface RoomDetailProps {
  room: BiddingRoom;
  onBack: () => void;
}

export default function RoomDetail({ room, onBack }: RoomDetailProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] =
    useState<BiddingRoomAuction | null>(null);
  const [auctionDetailsOpen, setAuctionDetailsOpen] = useState(false);

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
          <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => setParticipantsOpen(true)}
          >
            {(room.participants?.length ?? 0)} Participant
            {(room.participants?.length ?? 0) !== 1 ? 's' : ''}
          </Badge>
          <Badge className={statusStyles[room.status] ?? ''}>
            {room.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Seller: {room.seller}</span>
        </div>
      </div>

      {/* Auction Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {room.auctionsList?.map((auction) => (
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
        participants={room.participants ?? []}
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
