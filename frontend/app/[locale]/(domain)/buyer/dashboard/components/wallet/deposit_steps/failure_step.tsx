'use client';

import { XCircle } from 'lucide-react';

import { Button } from '@/shared/components/common';

interface FailureStepProps {
  onRetry: () => void;
}

export default function DepositFailureStep({ onRetry }: FailureStepProps) {
  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold">Deposit Failed</h3>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t complete your deposit. Please try again or use a
        different payment method.
      </p>
      <Button className="w-full" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
