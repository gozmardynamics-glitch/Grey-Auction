'use client';

import { useState } from 'react';
import { Button, Logo } from '@/shared/components/common';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';
import { useRouter } from 'next/navigation';

interface OTPVerificationProps {
  email: string;
  length?: number;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  title?: string;
  description?: string;
}

export default function BuyerOTPVerification({
  email,
  length = 6,
  onResend,
  title = 'Verify Account',
  description,
}: OTPVerificationProps) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== length) {
      return;
    }
    router.push('/auth/buyer/register/otp/complete_profile');
    setIsVerifying(true);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setOtp('');
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-6 md:px-16 py-20 bg-background rounded-2xl shadow-xl">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          {title}
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          {description || `Enter the ${length}-digit code sent to ${email}`}
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-foreground mb-3">
            Code
          </label>
          <div className="">
            <InputOTP
              maxLength={length}
              value={otp}
              numbersOnly={true}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup className="w-full justify-between gap-2">
                {Array.from({ length }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-16 w-24 text-3xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Resend Link */}
        <div>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t get code?
            <Button
              variant="link"
              onClick={handleResend}
              disabled={isResending}
              // className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend'}
            </Button>
          </p>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={otp.length !== length || isVerifying}
          className="w-full h-12 bg-primary hover:bg-primary-2 text-primary-foreground font-semibold text-base"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </Button>
      </div>
    </div>
  );
}
