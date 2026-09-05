'use client';

import { Button } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

interface ResetPinSuccessStepProps {
  onGoToWithdraw: () => void;
}

export default function ResetPinSuccessStep({ onGoToWithdraw }: ResetPinSuccessStepProps) {
  const t = useTranslations('buyer.wallet.withdraw.resetSuccess');

  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      {/* Green checkmark with confetti */}
      <div className="flex h-24 w-24 items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Confetti dots */}
          <circle cx="20" cy="25" r="3" fill="#F59E0B" />
          <circle cx="80" cy="20" r="2.5" fill="#3B82F6" />
          <circle cx="15" cy="55" r="2" fill="#10B981" />
          <circle cx="85" cy="50" r="3" fill="#EF4444" />
          <circle cx="25" cy="75" r="2.5" fill="#8B5CF6" />
          <circle cx="75" cy="78" r="2" fill="#F59E0B" />
          <circle cx="35" cy="15" r="2" fill="#EC4899" />
          <circle cx="65" cy="12" r="2.5" fill="#10B981" />
          <circle cx="12" cy="40" r="2" fill="#3B82F6" />
          <circle cx="88" cy="35" r="2" fill="#EC4899" />
          {/* Confetti rectangles */}
          <rect x="28" y="85" width="5" height="2.5" rx="1" fill="#3B82F6" transform="rotate(-20 28 85)" />
          <rect x="70" y="88" width="5" height="2.5" rx="1" fill="#10B981" transform="rotate(15 70 88)" />
          <rect x="90" y="65" width="4" height="2" rx="1" fill="#F59E0B" transform="rotate(-30 90 65)" />
          {/* Green circle background */}
          <circle cx="50" cy="50" r="28" fill="#10B981" />
          {/* White checkmark */}
          <path
            d="M38 50 L46 58 L62 42"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('body')}
        </p>
      </div>

      <div className="flex justify-end w-full pt-2">
        <Button onClick={onGoToWithdraw}>{t('goToWithdraw')}</Button>
      </div>
    </div>
  );
}
