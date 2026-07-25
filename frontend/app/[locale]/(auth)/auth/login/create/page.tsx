// app/(auth)/signup/page.tsx
import Link from 'next/link';
import { Logo } from '@/shared/components/common';
import AccountTypeSelector from '../../_islands/account_type_selector';

export default function SignupPage() {
  return (
    <div className="min-h-screen  items-center w-full rounded-2xl shadow-xl px-6 md:px-16 py-14 md:py-20  justify-center bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Welcome Text */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          Create an Account
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Choose how you want to use the platform.
        </p>
      </div>

      <AccountTypeSelector />

      {/* Login Link */}
      <div className="">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
