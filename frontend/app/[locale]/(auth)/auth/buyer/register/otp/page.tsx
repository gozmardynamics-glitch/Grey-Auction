'use client';

import { useState } from 'react';
import { Button, Logo } from '@/shared/components/common';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

/**
 * Email OTP step.
 *
 * A Next.js page cannot take required props, and this one never called the API:
 * it just navigated on. It now verifies against POST /auth/verify-otp (and can
 * resend via POST /auth/send-otp) using the email passed from registration in
 * the query string or sessionStorage.
 */
export default function BuyerOTPVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email =
    searchParams.get('email') ||
    (typeof window !== 'undefined'
      ? window.sessionStorage.getItem('greyauction:pendingEmail') || ''
      : '');

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    if (!email) {
      setError('We lost track of your email. Please sign in to verify.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      await apiFetch('auth/verify-otp', { method: 'POST', body: { email, otp } });
      router.push('/auth/buyer/register/otp/complete_profile');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'That code did not work. Please try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('We lost track of your email. Please sign in to verify.');
      return;
    }
    setIsResending(true);
    setError(null);
    try {
      await apiFetch('auth/send-otp', { method: 'POST', body: { email } });
      setOtp('');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not resend the code. Please try again.',
      );
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
          Verify Account
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          {`Enter the 6-digit code sent to ${email || 'your email'}`}
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
