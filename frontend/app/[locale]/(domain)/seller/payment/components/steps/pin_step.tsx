import {
  Button,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';

interface PinStepProps {
  pin: string;
  onPinChange: (value: string) => void;
  onForgotPin: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PinStep({
  pin,
  onPinChange,
  onForgotPin,
  onCancel,
  onConfirm,
}: PinStepProps) {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-lg font-semibold">PIN</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 p-6 pt-4">
        <p className="text-sm text-muted-foreground">
          Enter your 4-digit withdrawal PIN to continue.
        </p>

        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={onPinChange}
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

        <p className="text-sm text-muted-foreground">
          Forgot PIN?{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-medium text-primary hover:underline"
            onClick={onForgotPin}
          >
            Reset.
          </Button>
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={pin.length !== 4} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </>
  );
}
