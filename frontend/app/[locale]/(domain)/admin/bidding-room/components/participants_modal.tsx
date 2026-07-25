'use client';

import { useState } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from '@/shared/components/common';
import { Users } from 'lucide-react';
import { type BiddingRoomParticipant } from '../../models';
import RemoveParticipantDialog from './remove_participant_dialog';

interface ParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: BiddingRoomParticipant[];
}

export default function ParticipantsModal({
  open,
  onOpenChange,
  participants,
}: ParticipantsModalProps) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [_selectedParticipant, setSelectedParticipant] =
    useState<BiddingRoomParticipant | null>(null);

  const handleRemove = (participant: BiddingRoomParticipant) => {
    setSelectedParticipant(participant);
    setRemoveOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold">
                Participants
              </DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {participants.length}
              </Badge>
            </div>
          </DialogHeader>

          {participants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No participants have joined this room yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar>
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>
                        {participant.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {participant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {participant.joinedAt}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleRemove(participant)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <RemoveParticipantDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        onConfirm={() => {
          setRemoveOpen(false);
          setSelectedParticipant(null);
        }}
      />
    </>
  );
}
