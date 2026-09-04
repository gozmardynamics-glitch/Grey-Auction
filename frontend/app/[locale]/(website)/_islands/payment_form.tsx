'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Info } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/common/card';
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
} from '@/shared/components/common';
import { Separator } from '@/shared/components/common/separator';

import { PaymentProviderSelector, type PaymentProviderId } from '@/shared/components/common/payment_provider_selector';
import {
  formatCardNumber,
  formatCurrency,
  formatExpiry,
} from '@/shared/utils/helpers';
import {
  PaymentFormValues,
  paymentSchema,
} from '@/app/[locale]/(auth)/components/schema';
import Link from 'next/link';

interface OrderItem {
  name: string;
  price: number;
}

interface PaymentFormProps {
  orderItems: OrderItem[];
}

export default function PaymentForm({ orderItems }: PaymentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<PaymentProviderId>('paystack');
  const [instruction, setInstruction] = useState<string | null>(null);

  const total = orderItems.reduce((sum, item) => sum + item.price, 0);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      expiry: '',
      cvv: '',
      agreedToTerms: undefined,
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    setInstruction(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // The buy-now flow persists the fee-bearing invoice id in sessionStorage
      // before redirecting here; forwarding it links the Payment to the
      // invoice so webhook success flips the right order to paid (U5 flow).
      let invoiceId: string | null = null;
      try {
        invoiceId = sessionStorage.getItem('greyauction:buyNowInvoiceId');
      } catch {
        /* storage unavailable — init proceeds without invoice linkage */
      }

      // Buyer picks the payment platform; we create a Payment record and let the
      // chosen provider initialize. Redirect providers return a hosted checkout
      // URL; transfer/account providers return a payment instruction.
      const token = session?.user?.accessToken ?? null;
      const res = await fetch(`${apiBase}/payments/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // NOTE: `email` is intentionally NOT sent — the init DTO whitelists
        // fields and rejects unknown ones; the backend takes the buyer email
        // from the authenticated session instead.
        body: JSON.stringify({
          type: 'invoice',
          provider,
          amount: total,
          callbackUrl: window.location.origin + '/checkout/confirmation',
          metadata: {},
          ...(invoiceId ? { invoiceId } : {}),
        }),
      });

      if (!res.ok) {
        // Never fake success: a failed init must stop here with a visible
        // error instead of routing to the confirmation page.
        const err = await res.json().catch(() => null);
        toast.error(err?.message || 'Could not start the payment. Please try again.');
        return;
      }

      const json = await res.json().catch(() => null);
      const d = json?.data;

      if (d?.checkoutUrl) {
        // Redirect to the chosen gateway's hosted checkout.
        window.location.assign(d.checkoutUrl);
        return;
      }

      if (d?.paymentInstruction) {
        // Transfer/account-based provider — show the instruction.
        setInstruction(d.paymentInstruction);
        return;
      }

      // Mock/unconfigured provider (dev only) — complete the flow locally.
      router.push('/checkout/confirmation');
    } catch {
      toast.error('Payment could not be started. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-start gap-8"
      >
        {/* Card Details */}
        <div className="min-w-0 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Choose your payment platform</p>
                <PaymentProviderSelector value={provider} onChange={setProvider} columns={4} />
              </div>

              {instruction && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold">Pay via transfer</p>
                  <p className="mt-1 text-muted-foreground">{instruction}</p>
                </div>
              )}

              <Separator />

              {/* Card Number */}
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCardNumber(e.target.value))
                        }
                        maxLength={19}
                        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MM/YY"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatExpiry(e.target.value))
                          }
                          maxLength={5}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        CVV
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123"
                          type="password"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, '').slice(0, 4)
                            )
                          }
                          maxLength={4}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Providers */}
              <Separator />
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Guaranteed Payment
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-12 items-center justify-center rounded border bg-white px-1">
                    <svg
                      viewBox="0 0 24 16"
                      className="h-5 w-8"
                      fill="none"
                    >
                      <circle cx="9" cy="8" r="5" fill="#EB001B" />
                      <circle
                        cx="15"
                        cy="8"
                        r="5"
                        fill="#F79E1B"
                        fillOpacity="0.8"
                      />
                    </svg>
                  </div>
                  <div className="flex h-8 w-12 items-center justify-center rounded border bg-white px-1">
                    <svg
                      viewBox="0 0 24 16"
                      className="h-5 w-8"
                      fill="none"
                    >
                      <path
                        d="M9 3L7 13H9.5L11.5 3H9ZM16.5 3L14 9L13.5 3H11L12.5 13H15L19 3H16.5Z"
                        fill="#1A1F71"
                      />
                    </svg>
                  </div>
                  <div className="flex h-8 w-12 items-center justify-center rounded border bg-white px-1">
                    <svg
                      viewBox="0 0 24 16"
                      className="h-5 w-8"
                      fill="none"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="8"
                        rx="1"
                        fill="#006FCF"
                      />
                      <text
                        x="12"
                        y="10"
                        textAnchor="middle"
                        fill="white"
                        fontSize="5"
                        fontWeight="bold"
                      >
                        AMEX
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="sticky top-6 w-[350px] shrink-0">
          <CardHeader>
            <CardTitle className="text-base">Your Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="max-w-[180px] text-sm text-foreground line-clamp-1">
                  {item.name}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(total)}
              </span>
            </div>

            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">
                    By clicking accept, you agree to our{' '}
                    <Link href="/terms" className="text-primary underline">
                      terms and conditions
                    </Link>{' '}
                    and are obliged to create an agreement contract with us
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
