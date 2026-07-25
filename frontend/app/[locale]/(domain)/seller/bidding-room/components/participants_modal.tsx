'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from '@/shared/components/common';
import type { BiddingRoomParticipant } from '../../models';
import RemoveParticipantDialog from './remove_participant_dialog';

interface ParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: BiddingRoomParticipant[];
  onRemove: (participantId: string) => void;
}

export default function ParticipantsModal({
  open,
  onOpenChange,
  participants,
  onRemove,
}: ParticipantsModalProps) {
  const [removeTarget, setRemoveTarget] = useState<BiddingRoomParticipant | null>(null);

  const handleConfirmRemove = () => {
    if (removeTarget) {
      onRemove(removeTarget.id);
      setRemoveTarget(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle>Participants</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {participants.length} Participant{participants.length !== 1 ? 's' : ''}
              </p>
            </DialogHeader>

            <ScrollArea className="max-h-[400px] overflow-y-auto">
              <div className="space-y-1">
                {participants.map((participant) => {
                  const initials = participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2);

                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-muted/50 "
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {initials}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{participant.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveTarget(participant)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <RemoveParticipantDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        participantName={removeTarget?.name ?? ''}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
