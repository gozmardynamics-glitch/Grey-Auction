'use client';

import {
  Button,
  Checkbox,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/common';
import type { AuctionDuration } from '../../../models';
import { Info } from 'lucide-react';

const DURATIONS: AuctionDuration[] = [
  '1 day',
  '3 days',
  '7 days',
  '14 days',
  '27 days',
  '1 month',
  '2 months',
  '3 months',
];

export interface RoomDetailsData {
  roomName: string;
  allowInviteCode: boolean;
  inviteCode: string;
  duration: AuctionDuration;
}

interface RoomDetailsStepProps {
  data: RoomDetailsData;
  onChange: (data: RoomDetailsData) => void;
  onContinue: () => void;
}

export default function RoomDetailsStep({
  data,
  onChange,
  onContinue,
}: RoomDetailsStepProps) {
  const update = (partial: Partial<RoomDetailsData>) =>
    onChange({ ...data, ...partial });

  const isValid = data.roomName.trim().length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Room Name</Label>
            <Input
              value={data.roomName}
              onChange={(e) => update({ roomName: e.target.value })}
              placeholder="Enter Room Name"
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">Manage Room</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Checkbox
                  id="allow-invite"
                  checked={data.allowInviteCode}
                  onCheckedChange={(checked) =>
                    update({ allowInviteCode: !!checked })
                  }
                />
                <Label htmlFor="allow-invite" className="text-sm">
                  Allow Invite Code?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <ol>
                        <li>Missed if bidder needs to pay before entry.</li>
                        <li>Missed if bidder is charged per bid.</li>
                        <li>
                          Missed if room is public which is an override for
                          requiring code.
                        </li>
                      </ol>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {data.allowInviteCode && (
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input
                  value={data.inviteCode}
                  onChange={(e) => update({ inviteCode: e.target.value })}
                  placeholder="Enter Code"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 border border-border rounded-lg p-3">
          <p className="text-sm font-semibold">Bidding Room Duration</p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Button
                key={d}
                type="button"
                variant={data.duration === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => update({ duration: d })}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>
      </div>


      

      <div className="flex justify-end">
        <Button disabled={!isValid} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
