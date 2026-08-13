'use client';

import { useState } from 'react';
import { Trash2, Crown, Shield, CheckCircle2, Clock } from 'lucide-react';
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

// Colorful avatar palette
const AVATAR_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
                {participants.length} Participant{participants.length !== 1 ? 's' : ''} in this room
              </p>
            </DialogHeader>

            <ScrollArea className="max-h-[400px] overflow-y-auto">
              <div className="space-y-1">
                {participants.map((participant, index) => {
                  const initials = participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const avatarColor = getAvatarColor(participant.id);
                  const isHost = index === 0;

                  return (
                    <div
                      key={participant.id}
                      className="group flex items-center justify-between rounded-lg px-2 py-3 hover:bg-muted/50 transition-colors animate-in fade-in-0 slide-in-from-left-2"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${avatarColor} text-white shadow-sm`}
                          >
                            <span className="text-sm font-semibold">{initials}</span>
                          </div>
                          {isHost && (
                            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
                              <Crown className="h-3 w-3 text-amber-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{participant.name}</span>
                          {isHost && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Host
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Joined
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          onClick={() => setRemoveTarget(participant)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Invite status legend */}
            <div className="flex items-center gap-4 border-t border-border pt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Joined
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                Invited (pending)
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                Deposit paid
              </span>
            </div>
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
