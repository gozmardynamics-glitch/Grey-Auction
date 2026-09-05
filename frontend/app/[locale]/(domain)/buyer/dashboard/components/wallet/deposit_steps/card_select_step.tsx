'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button, DialogHeader, DialogTitle } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard';
  last4: string;
}

const SAVED_CARDS: SavedCard[] = [
  { id: '1', brand: 'visa', last4: '4321' },
  { id: '2', brand: 'mastercard', last4: '3287' },
];

interface CardSelectStepProps {
  amount: number;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function CardSelectStep({
  amount,
  onNext,
  onBack,
  onCancel,
}: CardSelectStepProps) {
  const t = useTranslations('buyer.wallet.deposit.cardSelect');
  const [selectedCard, setSelectedCard] = useState(SAVED_CARDS[0]?.id ?? '');

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

      {/* Card list */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t('cards')}</p>
        <div className="space-y-2">
          {SAVED_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedCard(card.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 transition-colors',
                selectedCard === card.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {/* Card brand logo */}
              <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-muted">
                {card.brand === 'visa' ? (
                  <span className="text-[10px] font-bold tracking-wider text-blue-600">
                    VISA
                  </span>
                ) : (
                  <div className="flex">
                    <div className="h-4 w-4 rounded-full bg-red-500 -mr-1.5" />
                    <div className="h-4 w-4 rounded-full bg-orange-400" />
                  </div>
                )}
              </div>

              <span className="flex-1 text-left text-sm">
                ****{card.last4}
              </span>

              {/* Radio indicator */}
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  selectedCard === card.id
                    ? 'border-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {selectedCard === card.id && (
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
        <Button disabled={!selectedCard} onClick={onNext}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
