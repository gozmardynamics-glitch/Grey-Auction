import BiddingRoomView from '../_islands/bidding_room_view';
import { getAdminBiddingRooms } from '@/lib/server/data';

export default async function BiddingRoomManagement() {
  const rooms = await getAdminBiddingRooms();

  return (
    <div className="space-y-6">
      <BiddingRoomView rooms={rooms} />
    </div>
  );
}
