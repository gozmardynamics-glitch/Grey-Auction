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
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const resolvedName = accountNumber.length === 10 ? 'JAYDEN NICHOLAS' : '';
  const canContinue =
    bankName !== '' && accountNumber.length === 10 && resolvedName !== '';

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>Direct Debit</DialogTitle>
        <DialogDescription>
          You need to link your bank account to fund your wallet through a direct
          debit easily. Only add a bank account that is linked to your BVN.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Account Number</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Enter account number"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setAccountNumber(val);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Bank Name</Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bank" />
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
          Cancel
        </Button>
        <Button
          disabled={!canContinue}
          onClick={() => onNext(accountNumber, bankName)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
