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
}

export default function AddAccountStep({ onNext, onCancel }: AddAccountStepProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const resolvedName = accountNumber.length === 10 ? 'JAYDEN NICHOLAS' : '';
  const accountError =
    accountNumber.length > 0 &&
    accountNumber.length !== 10 &&
    accountNumber.length > 5
      ? 'Invalid bank account or account number'
      : '';
  const canAddAccount =
    selectedBank !== '' && accountNumber.length === 10 && resolvedName !== '';

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>Add an Account</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Bank Account</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
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
          {accountError && (
            <p className="text-sm text-destructive">{accountError}</p>
          )}
          {resolvedName && (
            <p className="text-sm font-semibold text-foreground">
              {resolvedName}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!canAddAccount} onClick={onNext}>
          Add Account
        </Button>
      </div>
    </div>
  );
}
