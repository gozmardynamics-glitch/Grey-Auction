'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/components/common';

interface InviteBidderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
}

export default function InviteBidderModal({
  open,
  onOpenChange,
  roomName,
}: InviteBidderModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleReset = () => {
    setStep('form');
    setFirstName('');
    setLastName('');
    setEmail('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const handleInvite = () => {
    setStep('success');
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim();

  const initials = firstName.trim()
    ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase()
    : '';

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm p-0">
          <div className="flex flex-col items-center p-6 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-10 w-10"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="40" height="40" rx="20" fill="#EFF6FF" />
                <path
                  d="M12 20L18 26L28 14"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invite Link Sent Successfully.</h3>
              <p className="text-sm text-muted-foreground">
                You have invited{' '}
                <span className="font-medium text-foreground">{email}</span> to be a
                participant in {roomName} bidding room.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-auto">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            {initials && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">{initials}</span>
              </div>
            )}
            <DialogHeader>
              <DialogTitle>Invite Participant</DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                placeholder=""
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                placeholder=""
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!isFormValid} onClick={handleInvite}>
              Invite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
