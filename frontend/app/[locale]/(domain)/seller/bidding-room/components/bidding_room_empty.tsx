import { Gavel } from 'lucide-react';
import { Button } from '@/shared/components/common';

interface BiddingRoomEmptyProps {
  onCreateRoom: () => void;
}

export default function BiddingRoomEmpty({ onCreateRoom }: BiddingRoomEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Gavel className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No Bidding Rooms Yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Create a bidding room to organize your auctions and invite bidders to participate.
      </p>
      <Button onClick={onCreateRoom}>Create Room</Button>
    </div>
  );
}
