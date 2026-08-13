'use client';

import { SignIn } from '@clerk/nextjs';
import { Logo } from '@/shared/components/common';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-6">
        <Logo className="text-3xl" />
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-none border border-border',
          },
        }}
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
