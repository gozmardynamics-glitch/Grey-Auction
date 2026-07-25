'use client';

import { useMemo, useState, useCallback } from 'react';
import { Plus, Gavel } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
} from '@/shared/components/common';
import { BiddingRoom } from '../models';
import { createColumns } from '../bidding-room/components/bidding_room_columns';
import BiddingRoomEmpty from '../bidding-room/components/bidding_room_empty';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const RoomDetail = dynamic(() => import('../bidding-room/components/room_detail'));
const CreateRoom = dynamic(() => import('../bidding-room/components/create_room'));

type View = 'list' | 'detail' | 'create';

interface SellerBiddingRoomViewProps {
  rooms: BiddingRoom[];
}

export default function SellerBiddingRoomView({ rooms }: SellerBiddingRoomViewProps) {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const [selectedRoom, setSelectedRoom] = useState<BiddingRoom | null>(null);

  const handleEnterRoom = useCallback((room: BiddingRoom) => {
    setSelectedRoom(room);
    setView('detail');
  }, []);

  const handleCreateRoom = useCallback(() => {
    setView('create');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
    setSelectedRoom(null);
  }, []);

  const handleGoToDashboard = useCallback(() => {
    router.push('/seller/dashboard');
  }, [router]);

  const columns = useMemo(
    () => createColumns({ onEnterRoom: handleEnterRoom }),
    [handleEnterRoom]
  );

  // Show create room view
  if (view === 'create') {
    return (
      <CreateRoom
        onBack={handleBackToList}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Show room detail view
  if (view === 'detail' && selectedRoom) {
    return (
      <RoomDetail
        room={selectedRoom}
        onBack={handleBackToList}
      />
    );
  }

  const hasRooms = rooms.length > 0;

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bidding Room</h1>
        <Button onClick={handleCreateRoom} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>

      {hasRooms ? (
        <DataTable
          columns={columns}
          data={rooms}
          title="All"
          emptyIcon={<Gavel className="h-10 w-10" />}
          emptyTitle="No Bidding Rooms Found"
          emptyDescription="No rooms match your search criteria."
        />
      ) : (
        <Card className="bg-card p-4">
          <BiddingRoomEmpty onCreateRoom={handleCreateRoom} />
        </Card>
      )}
    </>
  );
}
