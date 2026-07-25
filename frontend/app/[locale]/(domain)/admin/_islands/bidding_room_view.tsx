'use client';

import { useCallback, useState } from 'react';

import BiddingRoomTable from '../bidding-room/components/bidding_room_table';
import RoomDetail from '../bidding-room/components/room_detail';
import { BiddingRoom } from '../models';
import { BIDDING_ROOM_TAB_FILTERS } from '../models/data';
import { DatePickerSimple } from '@/shared/components/common/date_picker';

interface BiddingRoomViewProps {
  rooms: BiddingRoom[];
}

export default function BiddingRoomView({
  rooms,
}: BiddingRoomViewProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedRoom, setSelectedRoom] = useState<BiddingRoom | null>(null);

  const handleEnterRoom = useCallback((room: BiddingRoom) => {
    setSelectedRoom(room);
    setView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
    setSelectedRoom(null);
  }, []);

  if (view === 'detail' && selectedRoom) {
    return <RoomDetail room={selectedRoom} onBack={handleBackToList} />;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bidding Room</h1>
        <div className="flex items-center gap-1">
          <DatePickerSimple />
        </div>
      </div>

      <BiddingRoomTable
        data={rooms}
        tabFilters={BIDDING_ROOM_TAB_FILTERS}
        onEnterRoom={handleEnterRoom}
      />
    </>
  );
}
