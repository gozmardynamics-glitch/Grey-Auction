'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleUserRound } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Logo,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/common';
import { CompleteProfileFormValues, completeProfileSchema } from '@/app/[locale]/(auth)/components/schema';


// Form validation schema

export default function CompleteProfilePage() {
  const [isLoading, _setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      phone: '',
      country: 'nigeria',
      address: '',
      state: '',
      city: '',
    },
  });

  const onSubmit = async (data: CompleteProfileFormValues) => {
    console.log('Complete profile data:', data);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-20 w-full rounded-2xl shadow-xl bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-xl font-bold text-foreground">
          Complete your profile
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          We just need a few more details to get your account set up.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Phone Number</FormLabel>
                <div className="flex gap-2">
                  <Select defaultValue="+234">
                    <SelectTrigger className="md:w-32 w-20 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+234">+234</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      disabled={isLoading}
                      {...field}
                      className="h-12 flex-1"
                    />
                  </FormControl>
                </div>
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
                <FormLabel className="text-foreground">Country</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nigeria">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇳🇬</span>
                        <span>Nigeria</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="usa">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        <span>United States</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="uk">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇬🇧</span>
                        <span>United Kingdom</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Street Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  Street Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter street address"
                    disabled={isLoading}
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* State and City */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* State */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">State</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lagos">Lagos</SelectItem>
                      <SelectItem value="abuja">Abuja</SelectItem>
                      <SelectItem value="rivers">Rivers</SelectItem>
                      <SelectItem value="kano">Kano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">City</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ikeja">Ikeja</SelectItem>
                      <SelectItem value="lekki">Lekki</SelectItem>
                      <SelectItem value="victoria-island">
                        Victoria Island
                      </SelectItem>
                      <SelectItem value="yaba">Yaba</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary-2 text-primary-foreground font-semibold text-base"
            disabled={isLoading}
          >
            {isLoading ? 'Completing Setup...' : 'Complete Setup'}
          </Button>
        </form>
      </Form>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Account Created Successfully</DialogTitle>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CircleUserRound className="h-8 w-8 text-green-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <CircleCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground" aria-hidden="true">
              Account Created Successfully
            </h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re all set to start exploring auctions.
            </p>
            <Button
              className="w-full bg-primary hover:bg-primary-2 text-primary-foreground font-semibold"
              onClick={() => router.push('/auctions')}
            >
              Explore Auctions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
