'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button, DialogHeader, DialogTitle } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SavedBankAccount {
  id: string;
  accountName: string;
  bankName: string;
  maskedAccount: string;
  avatar?: string;
}

const SAVED_BANK_ACCOUNTS: SavedBankAccount[] = [
  {
    id: '1',
    accountName: 'Jayden Nicholas',
    bankName: 'Wema Bank',
    maskedAccount: '******1789',
  },
];

interface BankAccountSelectStepProps {
  amount: number;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function BankAccountSelectStep({
  amount,
  onNext,
  onBack,
  onCancel,
}: BankAccountSelectStepProps) {
  const t = useTranslations('buyer.wallet.deposit.bankSelect');
  const [selectedAccount, setSelectedAccount] = useState(
    SAVED_BANK_ACCOUNTS[0]?.id ?? ''
  );

  return (
    <div className="p-6 space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <DialogTitle>{t('title')}</DialogTitle>
        </div>
      </DialogHeader>

      {/* Amount display */}
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
        <p className="text-sm text-muted-foreground">{t('enterAmount')}</p>
      </div>

      {/* Bank account list */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t('bankAccount')}</p>
        <div className="space-y-2">
          {SAVED_BANK_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedAccount(account.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 transition-colors',
                selectedAccount === account.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-medium">
                {account.accountName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{account.accountName}</p>
                <p className="text-xs text-muted-foreground">
                  {account.bankName}, {account.maskedAccount}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  selectedAccount === account.id
                    ? 'border-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {selectedAccount === account.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button disabled={!selectedAccount} onClick={onNext}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
