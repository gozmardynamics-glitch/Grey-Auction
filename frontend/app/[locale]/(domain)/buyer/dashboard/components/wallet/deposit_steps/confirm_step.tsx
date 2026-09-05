'use client';

import {
  Button,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';

import { formatCurrency } from '@/shared/utils/helpers';
import { useTranslations } from 'next-intl';
import { PaymentProviderSelector, type PaymentProviderId } from '@/shared/components/common/payment_provider_selector';

const PROCESSING_FEE_RATE = 0.015;

interface ConfirmStepProps {
  amount: number;
  paymentMethodLabel: string;
  provider: PaymentProviderId;
  onProviderChange: (provider: PaymentProviderId) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export default function DepositConfirmStep({
  amount,
  paymentMethodLabel,
  provider,
  onProviderChange,
  onConfirm,
  onBack,
}: ConfirmStepProps) {
  const t = useTranslations('buyer.wallet.deposit.confirm');
  const processingFee = amount * PROCESSING_FEE_RATE;
  const totalAmount = amount + processingFee;

  return (
    <div className="p-6 space-y-6">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
      </DialogHeader>

      <div>
        <p className="mb-2 text-sm font-medium">{t('choosePlatform')}</p>
        <PaymentProviderSelector value={provider} onChange={onProviderChange} columns={2} />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('amount')}</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('paymentMethod')}</span>
            <span className="font-medium">{paymentMethodLabel}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('processingFee')}</span>
            <span className="font-medium">{formatCurrency(processingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t('totalAmount')}</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          {t('cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('confirm')}</Button>
      </div>
    </div>
  );
}
