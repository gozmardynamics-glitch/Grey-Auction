'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Logo,
} from '@/shared/components/common';
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '../../../components/schema';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      router.push('/auth/login/forgot_password/reset_password');
    } catch {
      form.setError('root', { message: 'Failed to send reset link. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen  items-center w-full rounded-2xl shadow-xl px-6 md:px-16 py-20 justify-center bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Welcome Text */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          Forgot Password
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>
      </div>

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Root Error */}
          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          {/* Sign In Button */}
          <div className="flex flex-col gap-2">
            <Button type="submit" size="xl" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button
              type="button"
              size="xl"
              onClick={() => router.push('/auth/login')}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? 'Returning...' : 'Return to Sign In'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
