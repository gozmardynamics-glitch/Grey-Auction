import { Button } from '@/shared/components/common';

interface PinResetSuccessStepProps {
  onGoToWithdraw: () => void;
}

export default function PinResetSuccessStep({
  onGoToWithdraw,
}: PinResetSuccessStepProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="20" r="3" fill="#22c55e" />
          <circle cx="80" cy="15" r="2.5" fill="#3b82f6" />
          <circle cx="15" cy="60" r="2" fill="#f59e0b" />
          <circle cx="85" cy="55" r="3" fill="#ef4444" />
          <circle cx="35" cy="10" r="2" fill="#8b5cf6" />
          <circle cx="65" cy="85" r="2.5" fill="#22c55e" />
          <circle cx="25" cy="80" r="2" fill="#3b82f6" />
          <circle cx="75" cy="30" r="2" fill="#f59e0b" />
          <circle cx="50" cy="50" r="22" fill="#22c55e" />
          <path
            d="M40 50 L47 57 L62 42"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold">PIN Reset Successful!</h3>
        <p className="text-sm text-muted-foreground">
          You have successfully reset your withdrawal PIN!
        </p>
      </div>

      <Button onClick={onGoToWithdraw}>Go to Withdraw</Button>
    </div>
  );
}
