'use client';

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
} from '@/shared/components/common';

import { businessDetailsSchema, BusinessDetailsValues } from '../models/schema';

interface BusinessDetailsStepProps {
  defaultValues: BusinessDetailsValues;
  onNext: (data: BusinessDetailsValues) => void;
  onBack: () => void;
}

export default function BusinessDetailsStep({
  defaultValues,
  onNext,
  onBack,
}: BusinessDetailsStepProps) {
  const form = useForm<BusinessDetailsValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter company name"
                  {...field}
                  className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter registration number"
                  {...field}
                  className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter postal code"
                  {...field}
                  className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Street address"
                  {...field}
                  className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Lagos"
                    {...field}
                    className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Lagos State"
                    {...field}
                    className="bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={onBack}
          >
            Go Back
          </Button>
          <Button type="submit" className="flex-1 h-12">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
