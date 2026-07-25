import { Pencil } from 'lucide-react';
import { Badge, Button } from '@/shared/components/common';
import { DUMMY_LISTINGS } from '../../../models';
import type { RoomDetailsData } from './room_details_step';
import Image from 'next/image';

interface ReviewStepProps {
  roomDetails: RoomDetailsData;
  selectedAuctionIds: string[];
  onEditStep: (step: number) => void;
  onPublish: () => void;
  isSubmitting?: boolean;
}

export default function ReviewStep({
  roomDetails,
  selectedAuctionIds,
  onEditStep,
  onPublish,
  isSubmitting,
}: ReviewStepProps) {
  const selectedAuctions = DUMMY_LISTINGS.filter((l) =>
    selectedAuctionIds.includes(l.lotId)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Details Summary */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Room Details</p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => onEditStep(1)}
            >
              Edit
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-medium">{roomDetails.roomName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Allow Invite Code: </span>
              <span className="font-medium">
                {roomDetails.allowInviteCode ? 'Yes' : 'No'}
              </span>
            </div>
            {roomDetails.allowInviteCode && (
              <div>
                <span className="text-muted-foreground">Invite Code: </span>
                <span className="font-medium">{roomDetails.inviteCode}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">
                Bidding Room Duration:{' '}
              </span>
              <span className="font-medium capitalize">
                {roomDetails.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Auctions Summary */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Auctions</p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => onEditStep(2)}
            >
              Edit
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            {selectedAuctions.map((auction) => (
              <div
                key={auction.lotId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {auction.lotId}
                  </span>
                  {auction.itemImage && (
                    <div className="relative h-8 w-8 overflow-hidden rounded bg-muted">
                      <Image
                        src={auction.itemImage}
                        alt={auction.item}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium">{auction.item}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-tertiary/10 text-tertiary-1 font-medium"
                >
                  {auction.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onPublish} disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
