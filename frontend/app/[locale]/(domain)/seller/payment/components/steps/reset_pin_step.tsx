import {
  Button,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';

interface ResetPinStepProps {
  newPin: string;
  onNewPinChange: (value: string) => void;
  confirmPin: string;
  onConfirmPinChange: (value: string) => void;
  canReset: boolean;
  onCancel: () => void;
  onReset: () => void;
}

export default function ResetPinStep({
  newPin,
  onNewPinChange,
  confirmPin,
  onConfirmPinChange,
  canReset,
  onCancel,
  onReset,
}: ResetPinStepProps) {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-lg font-semibold">Reset PIN</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 p-6 pt-4">
        <p className="text-sm text-muted-foreground">
          Enter a new 4-digit withdrawal PIN to continue.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-primary">
            Enter New PIN
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={newPin}
              onChange={onNewPinChange}
              numbersOnly
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm PIN</label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={confirmPin}
              onChange={onConfirmPinChange}
              numbersOnly
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!canReset} onClick={onReset}>
            Reset PIN
          </Button>
        </div>
      </div>
    </>
  );
}
