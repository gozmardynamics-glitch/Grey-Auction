import {
  Button,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';

interface AmountStepProps {
  availableBalance: number;
  amount: string;
  onAmountChange: (value: string) => void;
  numericAmount: number;
  processingFee: number;
  totalAmount: number;
  isValidAmount: boolean;
  showBreakdown: boolean;
  amountError: string;
  formatCurrency: (value: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AmountStep({
  availableBalance,
  amount,
  onAmountChange,
  numericAmount,
  processingFee,
  totalAmount,
  isValidAmount,
  showBreakdown,
  amountError,
  formatCurrency,
  onCancel,
  onConfirm,
}: AmountStepProps) {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-lg font-semibold">Withdraw</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 p-6 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Available Balance:
          </span>
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        <Separator />

        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-baseline gap-1 text-4xl font-semibold">
            <span>₦</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                onAmountChange(val);
              }}
              className="w-40 bg-transparent text-center text-4xl font-semibold outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-sm text-muted-foreground">Enter Amount</p>
          {amountError && (
            <p className="text-sm text-destructive">{amountError}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Bank Account</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
              JN
            </div>
            <div>
              <p className="text-sm font-medium">Jayden Nicholas</p>
              <p className="text-xs text-muted-foreground">
                Access Bank • **** 1234
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm font-medium text-primary hover:underline"
          >
            Add Bank Account
          </Button>
        </div>

        {showBreakdown && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatCurrency(numericAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing fee</span>
                  <span>{formatCurrency(processingFee)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!isValidAmount} onClick={onConfirm}>
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </>
  );
}
