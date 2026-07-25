import { Button } from '@/shared/components/common';

interface WithdrawalReviewStepProps {
  onGoToPayment: () => void;
}

export default function WithdrawalReviewStep({
  onGoToPayment,
}: WithdrawalReviewStepProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 25 L22 20 L24 25 L22 30Z" fill="#f59e0b" />
          <path d="M78 20 L80 15 L82 20 L80 25Z" fill="#f59e0b" />
          <path d="M15 65 L17 60 L19 65 L17 70Z" fill="#f59e0b" />
          <path d="M83 70 L85 65 L87 70 L85 75Z" fill="#f59e0b" />
          <rect x="32" y="28" width="36" height="44" rx="4" fill="#3b82f6" opacity="0.15" />
          <rect x="36" y="32" width="28" height="36" rx="2" fill="#3b82f6" opacity="0.3" />
          <path
            d="M38 35 L50 50 L62 35Z"
            fill="#f59e0b"
            opacity="0.6"
          />
          <path
            d="M38 65 L50 50 L62 65Z"
            fill="#f59e0b"
          />
          <rect x="35" y="30" width="30" height="3" rx="1.5" fill="#1e40af" />
          <rect x="35" y="67" width="30" height="3" rx="1.5" fill="#1e40af" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          Withdrawal Request is in Review
        </h3>
        <p className="text-sm text-muted-foreground">
          Your withdrawal request has been received and is currently being
          processed.
        </p>
      </div>

      <Button onClick={onGoToPayment}>Go to Payment</Button>
    </div>
  );
}
