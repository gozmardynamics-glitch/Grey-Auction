'use client';

import { useMemo, useState } from 'react';
import { Home } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { BiddingRoom } from '../../models';
import { Columns } from './bidding_room_column';
import RoomDetailsModal from './room_details_modal';

interface BiddingRoomTableProps {
  data: BiddingRoom[];
  tabFilters?: readonly TabFilter[];
  title?: string;
  onEnterRoom?: (room: BiddingRoom) => void;
}

export default function BiddingRoomTable({
  data,
  tabFilters,
  title,
  onEnterRoom,
}: BiddingRoomTableProps) {
  const [selectedRoom, setSelectedRoom] = useState<BiddingRoom | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      Columns({
        onViewDetails: (room) => {
          setSelectedRoom(room);
          setDetailsOpen(true);
        },
        onEnterRoom: (room) => onEnterRoom?.(room),
        onSuspend: () => {},
        onActivate: () => {},
        onDelete: () => {},
      }),
    [onEnterRoom]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<Home className="h-10 w-10" />}
        emptyTitle="No Bidding Rooms Available"
        emptyDescription="New bidding rooms will appear here once sellers create them."
      />

      <RoomDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        room={selectedRoom}
      />
    </>
  );
}
