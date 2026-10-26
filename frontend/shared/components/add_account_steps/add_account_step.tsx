'use client';

import { useState } from 'react';
import {
  Button,
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
import { apiFetch, ApiError } from '@/shared/utils/api-client';

const BANK_OPTIONS = [
  'Access Bank Plc',
  'First Bank of Nigeria',
  'Guaranty Trust Bank',
  'United Bank for Africa',
  'Wema Bank Plc',
  'Zenith Bank Plc',
];

interface AddAccountStepProps {
  onNext: () => void;
  onCancel: () => void;
  /** Called with the saved account so the caller can continue the flow. */
  onSaved?: (account: { bankName: string; accountNumber: string }) => void;
}

export default function AddAccountStep({ onNext, onCancel, onSaved }: AddAccountStepProps) {
  const t = useTranslations('wallet.addAccount');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // No name-resolution service is wired, so the form no longer invents one:
  // it saves what the account holder entered and says so.
  const accountError =
    accountNumber.length > 5 && accountNumber.length !== 10
      ? t('invalidAccount')
      : '';
  const canAddAccount = selectedBank !== '' && accountNumber.length === 10;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleContinue = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiFetch('sellers/profile/me', {
        method: 'PATCH',
        body: {
          bank_account_details: {
            bank_name: selectedBank,
            account_number: accountNumber,
          },
        },
      });
      onSaved?.({ bankName: selectedBank, accountNumber });
      onNext();
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : 'Could not save the payout account. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('selectBank')}</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
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
          {accountError && (
            <p className="text-sm text-destructive">{accountError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            We will send withdrawals to this account. Double-check the number —
            it cannot be verified automatically yet.
          </p>
        </div>
      </div>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button disabled={!canAddAccount || saving} onClick={handleContinue}>
          {saving ? 'Saving…' : t('submit')}
        </Button>
      </div>
    </div>
  );
}
