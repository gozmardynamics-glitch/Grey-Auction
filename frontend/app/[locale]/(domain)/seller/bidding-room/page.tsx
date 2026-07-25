import SellerBiddingRoomView from '../_islands/bidding_room_view';
import { getSellerBiddingRooms } from '@/lib/server/data';

export default async function BiddingRoomPage() {
  const rooms = await getSellerBiddingRooms();

  return (
    <div className="space-y-8">
      <SellerBiddingRoomView rooms={rooms} />
    </div>
  );
}
