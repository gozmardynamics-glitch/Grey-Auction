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

const BANK_OPTIONS = [
  'Access Bank Plc',
  'First Bank of Nigeria',
  'Guaranty Trust Bank',
  'United Bank for Africa',
  'Wema Bank Plc',
  'Zenith Bank Plc',
];

interface DirectDebitStepProps {
  onNext: (accountNumber: string, bankName: string) => void;
  onCancel: () => void;
  onError: () => void;
}

export default function DirectDebitStep({
  onNext,
  onCancel,
}: DirectDebitStepProps) {
  const t = useTranslations('buyer.wallet.deposit.directDebit');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const resolvedName = accountNumber.length === 10 ? 'JAYDEN NICHOLAS' : '';
  const canContinue =
    bankName !== '' && accountNumber.length === 10 && resolvedName !== '';

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
          <Label>{t('accountNumber')}</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={t('accountNumberPlaceholder')}
            maxLength={10}
            value={accountNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setAccountNumber(val);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('bankName')}</Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger>
              <SelectValue placeholder={t('bankPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {BANK_OPTIONS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {resolvedName && (
          <p className="text-sm font-semibold text-primary">{resolvedName}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          disabled={!canContinue}
          onClick={() => onNext(accountNumber, bankName)}
        >
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
