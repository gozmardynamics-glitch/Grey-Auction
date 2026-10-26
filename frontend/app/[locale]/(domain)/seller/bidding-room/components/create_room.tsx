'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Separator } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import CreateRoomStepper from './create_room_steps/create_room_stepper';
import RoomDetailsStep, {
  type RoomDetailsData,
} from './create_room_steps/room_details_step';
import AuctionsStep from './create_room_steps/auctions_step';
import ReviewStep from './create_room_steps/review_step';
import RoomSubmittedDialog from './create_room_steps/room_submitted_dialog';
import type { AuctionDuration } from '../../models';

interface CreateRoomProps {
  onBack: () => void;
  onGoToDashboard: () => void;
}

const DEFAULT_ROOM_DETAILS: RoomDetailsData = {
  roomName: '',
  allowInviteCode: true,
  inviteCode: '',
  duration: '7 days',
};

/** Turn the chosen duration into the end date the API requires. */
function addDuration(from: Date, duration: AuctionDuration): Date {
  const end = new Date(from);
  const [rawCount, unit = 'days'] = duration.split(' ');
  const count = Number(rawCount) || 0;
  if (unit.startsWith('day')) end.setDate(end.getDate() + count);
  else end.setMonth(end.getMonth() + count);
  return end;
}

export default function CreateRoom({ onBack, onGoToDashboard }: CreateRoomProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [roomDetails, setRoomDetails] =
    useState<RoomDetailsData>(DEFAULT_ROOM_DETAILS);
  const [selectedAuctionIds, setSelectedAuctionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePublish = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const startTime = new Date();
      const endTime = addDuration(startTime, roomDetails.duration);

      // POST /rooms requires startTime and endTime; omitting them failed
      // validation, and the failure used to be swallowed into a success dialog
      // so the seller believed a room existed that did not.
      await apiFetch('rooms', {
        method: 'POST',
        body: {
          name: roomDetails.roomName,
          description: roomDetails.roomName,
          type: 'private',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: roomDetails.duration,
          allowInviteCode: roomDetails.allowInviteCode,
          inviteCode: roomDetails.allowInviteCode
            ? roomDetails.inviteCode || undefined
            : undefined,
          auctionIds: selectedAuctionIds,
        },
      });

      setShowSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'The room could not be created. Nothing was saved — please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [roomDetails, selectedAuctionIds]);

  return (
    <div className="space-y-6 border border-border bg-background p-2 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create Room</h1>
      </div>

      {/* Stepper + Content */}
      <div className="p-4 space-y-6 rounded-lg">
        <CreateRoomStepper currentStep={currentStep} />
        <Separator />

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <RoomDetailsStep
            data={roomDetails}
            onChange={setRoomDetails}
            onContinue={handleNext}
          />
        )}

        {currentStep === 2 && (
          <AuctionsStep
            selectedIds={selectedAuctionIds}
            onChange={setSelectedAuctionIds}
            onContinue={handleNext}
          />
        )}

        {currentStep === 3 && (
          <ReviewStep
            roomDetails={roomDetails}
            selectedAuctionIds={selectedAuctionIds}
            onEditStep={handleEditStep}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Success Dialog */}
      <RoomSubmittedDialog
        open={showSuccess}
        onGoToDashboard={onGoToDashboard}
      />
    </div>
  );
}
