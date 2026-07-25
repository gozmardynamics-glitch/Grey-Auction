import {
  Button,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';

interface ForgotPinStepProps {
  forgotCode: string;
  onForgotCodeChange: (value: string) => void;
  onVerify: () => void;
}

export default function ForgotPinStep({
  forgotCode,
  onForgotCodeChange,
  onVerify,
}: ForgotPinStepProps) {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-lg font-semibold">Forgot PIN</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 p-6 pt-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to j*********@gmail.com
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium">Code</label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={forgotCode}
              onChange={onForgotCodeChange}
              numbersOnly
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Don&apos;t get code?{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-medium text-primary hover:underline"
          >
            Resend.
          </Button>
        </p>

        <div className="flex items-center justify-end pt-2">
          <Button
            disabled={forgotCode.length !== 6}
            onClick={onVerify}
          >
            Verify
          </Button>
        </div>
      </div>
    </>
  );
}
