'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common/select';

import { formatCurrency } from '@/shared/utils/helpers';
import {
  CheckoutFormValues,
  checkoutSchema,
} from '@/app/[locale]/(auth)/components/schema';

interface OrderItem {
  name: string;
  price: number;
}

interface CheckoutFormProps {
  orderItems: OrderItem[];
}

export default function CheckoutForm({ orderItems }: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const total = orderItems.reduce((sum, item) => sum + item.price, 0);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneCode: '+234',
      phone: '',
      email: '',
      country: 'nigeria',
      houseNumber: '',
      street: '',
      state: '',
      city: '',
      postalCode: '',
      shipToDifferent: false,
      shipFirstName: '',
      shipLastName: '',
      shipCountry: '',
      shipHouseNumber: '',
      shipStreet: '',
      shipState: '',
      shipCity: '',
      shipPostalCode: '',
      agreedToTerms: false,
    },
  });

  const shipToDifferent = useWatch({ control: form.control, name: 'shipToDifferent' });

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      router.push('/checkout/payment');
    } catch {
      router.push('/checkout/payment');
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
        {/* Billing Form */}
        <div className="min-w-0 flex-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <FormLabel>Phone Number</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="phoneCode"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-[100px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+234">+234</SelectItem>
                          <SelectItem value="+1">+1</SelectItem>
                          <SelectItem value="+44">+44</SelectItem>
                          <SelectItem value="+32">+32</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            disabled={isLoading}
                            {...field}
                            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        disabled={isLoading}
                        {...field}
                        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="belgium">🇧🇪 Belgium</SelectItem>
                        <SelectItem value="cameroon">
                          🇨🇲 Cameroon
                        </SelectItem>
                        <SelectItem value="us">🇺🇸 United States</SelectItem>
                        <SelectItem value="uk">
                          🇬🇧 United Kingdom
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* House Number */}
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Number</FormLabel>
                    <FormControl>
                      <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Street */}
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* State & City */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lagos">Lagos</SelectItem>
                          <SelectItem value="abuja">Abuja</SelectItem>
                          <SelectItem value="kano">Kano</SelectItem>
                          <SelectItem value="rivers">Rivers</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ikeja">Ikeja</SelectItem>
                          <SelectItem value="lekki">Lekki</SelectItem>
                          <SelectItem value="vi">
                            Victoria Island
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Postal Code */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="shipToDifferent"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer text-sm font-normal text-muted-foreground">
                      Ship to different address?
                    </FormLabel>
                  </FormItem>
                )}
              />

              {shipToDifferent && (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shipLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shipCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nigeria">
                              🇳🇬 Nigeria
                            </SelectItem>
                            <SelectItem value="us">
                              🇺🇸 United States
                            </SelectItem>
                            <SelectItem value="uk">
                              🇬🇧 United Kingdom
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipHouseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Number</FormLabel>
                        <FormControl>
                          <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lagos">Lagos</SelectItem>
                              <SelectItem value="abuja">Abuja</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shipCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ikeja">Ikeja</SelectItem>
                              <SelectItem value="lekki">Lekki</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shipPostalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input
                          disabled={isLoading}
                          {...field}
                          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
