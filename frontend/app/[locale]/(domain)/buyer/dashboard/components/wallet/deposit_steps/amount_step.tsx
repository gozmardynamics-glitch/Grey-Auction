'use client';

import { useState } from 'react';
import { CreditCard, Building2 } from 'lucide-react';

import {
  Button,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/shared/utils/helpers';
import { PaymentMethodOption } from '../../../../models';


const MIN_AMOUNT = 100_000;

interface AmountStepProps {
  onNext: (amount: number, method: PaymentMethodOption) => void;
  onCancel: () => void;
}

export default function DepositAmountStep({
  onNext,
  onCancel,
}: AmountStepProps) {
  const t = useTranslations('buyer.wallet.deposit');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodOption>('bank-transfer');

  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT;
  const amountError =
    amount.length > 0 && numericAmount > 0 && numericAmount < MIN_AMOUNT
      ? t('minimumError', { amount: formatCurrency(MIN_AMOUNT) })
      : '';

  return (
    <div className="p-6 space-y-6">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
      </DialogHeader>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label>{t('amount')}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            &#8358;
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-lg font-semibold h-12"
            min={0}
          />
        </div>
        {amountError && (
          <p className="text-sm text-destructive">{amountError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('minimumInfo', { amount: formatCurrency(MIN_AMOUNT) })}
        </p>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <Label>{t('method')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPaymentMethod('bank-transfer')}
            className={cn(
              'flex items-center justify-start gap-3 rounded-lg border p-3 h-auto transition-colors',
              paymentMethod === 'bank-transfer'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                paymentMethod === 'bank-transfer' ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{t('bankTransfer')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setPaymentMethod('card')}
            className={cn(
              'flex items-center justify-start gap-3 rounded-lg border p-3 h-auto transition-colors',
              paymentMethod === 'card'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                paymentMethod === 'card' ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{t('card')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setPaymentMethod('direct-debit')}
            className={cn(
              'flex items-center justify-start gap-3 rounded-lg border p-3 h-auto transition-colors',
              paymentMethod === 'direct-debit'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                paymentMethod === 'direct-debit' ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{t('directDebit')}</span>
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          disabled={!isValidAmount}
          onClick={() => onNext(numericAmount, paymentMethod)}
        >
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}

export type { PaymentMethodOption };
