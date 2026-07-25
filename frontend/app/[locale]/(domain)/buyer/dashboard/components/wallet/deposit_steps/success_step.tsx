'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/shared/components/common';

interface SuccessStepProps {
  onDone: () => void;
}

export default function DepositSuccessStep({ onDone }: SuccessStepProps) {
  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/10">
        <CheckCircle2 className="h-8 w-8 text-tertiary-1" />
      </div>
      <h3 className="text-lg font-semibold">Deposit Successful!</h3>
      <p className="text-sm text-muted-foreground">
        Your wallet has been successfully funded. You can now use your
        balance for bids and purchases.
      </p>
      <Button className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
