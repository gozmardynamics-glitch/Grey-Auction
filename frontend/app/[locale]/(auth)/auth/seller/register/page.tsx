'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Logo,
} from '@/shared/components/common';

import {
  sellerRegisterSchema,
  SellerRegisterFormValues,
} from '../../../components/schema';
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
import { signIn } from 'next-auth/react';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);

  const form = useForm<SellerRegisterFormValues>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      account_type: 'individual',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SellerRegisterFormValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: `${data.first_name} ${data.last_name}`.trim(),
          role: 'seller',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }

      router.push('/auth/seller/register/otp');
    } catch (err: any) {
      form.setError('root', { message: err.message || 'Registration failed. Please try again.' });
    } finally {
      _setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/auth/seller/register/otp' });
  };

  return (
    <div className="min-h-screen w-full rounded-2xl shadow-xl px-6 md:px-16 py-20 bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Welcome Text */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          Create an Account
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <RadioGroup name="account_type" className="flex items-center gap-4">
            <RadioGroupItem value="individual">Individual</RadioGroupItem>
            <RadioGroupItem value="business">Business</RadioGroupItem>
          </RadioGroup>
          {/* First name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  First Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter your first name"
                    disabled={isLoading}
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    disabled={isLoading}
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    disabled={isLoading}
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      {...field}
                      className="h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terms and Conditions */}
          <div>
            <p className="text-muted-foreground flex items-center gap-1 text-xs md:text-base">
              <Checkbox />
              <span>
                By clicking Sign In, you agree to our {''}
                <Link href="/faq" className="text-primary m-0 p-0">
                  Terms & Conditions
                </Link>
              </span>
            </p>
          </div>

          {/* Root Error */}
          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="default"
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-foreground">or</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="w-full h-12"
        disabled={isLoading}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </div>
  );
}
