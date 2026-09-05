'use client';

import { useState } from 'react';

import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';
import { useTranslations } from 'next-intl';

const STATES = ['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Enugu'];
const CITIES: Record<string, string[]> = {
  Lagos: ['Lekki', 'Ikeja', 'Victoria Island', 'Surulere', 'Yaba'],
  Abuja: ['Garki', 'Wuse', 'Maitama', 'Asokoro'],
  Rivers: ['Port Harcourt', 'Obio-Akpor'],
  Oyo: ['Ibadan', 'Ogbomosho'],
  Kano: ['Kano Municipal', 'Nassarawa'],
  Enugu: ['Enugu', 'Nsukka'],
};

interface DirectDebitAddressStepProps {
  onNext: () => void;
  onCancel: () => void;
}

export default function DirectDebitAddressStep({
  onNext,
  onCancel,
}: DirectDebitAddressStepProps) {
  const t = useTranslations('buyer.wallet.deposit.address');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const canContinue = address.trim() !== '' && state !== '' && city !== '';

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>
          {t('description')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('address')}</Label>
          <Input
            placeholder={t('addressPlaceholder')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('state')}</Label>
          <Select
            value={state}
            onValueChange={(val) => {
              setState(val);
              setCity('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('statePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('city')}</Label>
          <Select value={city} onValueChange={setCity} disabled={!state}>
            <SelectTrigger>
              <SelectValue placeholder={t('cityPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(CITIES[state] || []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button disabled={!canContinue} onClick={onNext}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
