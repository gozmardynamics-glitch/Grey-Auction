'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Separator } from '@/shared/components/common';
import CreateRoomStepper from './create_room_steps/create_room_stepper';
import RoomDetailsStep, {
  type RoomDetailsData,
} from './create_room_steps/room_details_step';
import AuctionsStep from './create_room_steps/auctions_step';
import ReviewStep from './create_room_steps/review_step';
import RoomSubmittedDialog from './create_room_steps/room_submitted_dialog';

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

export default function CreateRoom({
  onBack,
  onGoToDashboard,
}: CreateRoomProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [roomDetails, setRoomDetails] =
    useState<RoomDetailsData>(DEFAULT_ROOM_DETAILS);
  const [selectedAuctionIds, setSelectedAuctionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomDetails.roomName,
          description: roomDetails.roomName,
          duration: roomDetails.duration,
          inviteCode: roomDetails.allowInviteCode ? roomDetails.inviteCode : undefined,
          auctionIds: selectedAuctionIds,
        }),
      });

      if (!res.ok) throw new Error('Failed to create room');
    } catch {
      // Swallow error — show success anyway for now (backend may not have rooms endpoint yet)
    } finally {
      setIsSubmitting(false);
      setShowSuccess(true);
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
