'use client';

import { Button } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

interface ReviewStepProps {
  onDone: () => void;
}

export default function ReviewStep({ onDone }: ReviewStepProps) {
  const t = useTranslations('buyer.wallet.withdraw.review');

  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      {/* Hourglass illustration */}
      <div className="flex h-24 w-24 items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="#EFF6FF" />
          {/* Hourglass body */}
          <rect x="32" y="25" width="36" height="6" rx="2" fill="#3B82F6" />
          <rect x="32" y="69" width="36" height="6" rx="2" fill="#3B82F6" />
          {/* Top glass */}
          <path d="M36 31 L50 50 L64 31 Z" fill="#FBBF24" opacity="0.3" />
          <path d="M36 31 L50 50 L64 31" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none" />
          {/* Bottom glass */}
          <path d="M36 69 L50 50 L64 69 Z" fill="#FBBF24" opacity="0.6" />
          <path d="M36 69 L50 50 L64 69" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none" />
          {/* Sand in bottom */}
          <path d="M42 69 L50 58 L58 69 Z" fill="#F59E0B" />
          {/* Falling sand */}
          <line x1="50" y1="50" x2="50" y2="56" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {t('title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('body')}
        </p>
      </div>

      <div className="flex justify-end w-full pt-2">
        <Button onClick={onDone}>{t('done')}</Button>
      </div>
    </div>
  );
}
