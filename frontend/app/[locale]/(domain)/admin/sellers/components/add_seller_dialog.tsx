'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/components/common';

interface AddSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;
}

export default function AddSellerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddSellerDialogProps) {
  const t = useTranslations('admin.sellers.dialogs.add');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setFirstName('');
      setLastName('');
      setEmail('');
    }
    onOpenChange(value);
  };

  const handleSubmit = () => {
    onSubmit({ firstName, lastName, email });
    handleOpenChange(false);
  };

  const isValid = firstName.trim() && lastName.trim() && email.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">{t('firstName')}</Label>
            <Input
              placeholder={t('firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{t('lastName')}</Label>
            <Input
              placeholder={t('lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{t('email')}</Label>
            <Input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button disabled={!isValid} onClick={handleSubmit}>
              {t('submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
