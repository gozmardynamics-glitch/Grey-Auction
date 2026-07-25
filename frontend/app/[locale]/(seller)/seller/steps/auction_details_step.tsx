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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';

import { auctionDetailsSchema, AuctionDetailsValues } from '../models/schema';
import { CATEGORIES, VALUE_RANGES } from '../models/data';

const ITEM_COUNTS = ['1 - 10', '11 - 50', '51 - 100', '100+'];

interface AuctionDetailsStepProps {
  defaultValues: AuctionDetailsValues;
  onSubmit: (data: AuctionDetailsValues) => void;
  onBack: () => void;
}

export default function AuctionDetailsStep({
  defaultValues,
  onSubmit,
  onBack,
}: AuctionDetailsStepProps) {
  const form = useForm<AuctionDetailsValues>({
    resolver: zodResolver(auctionDetailsSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                In which category would you like to auction?
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numberOfItems"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of items</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select number of items" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ITEM_COUNTS.map((count) => (
                    <SelectItem key={count} value={count}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated total value</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select estimated value" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VALUE_RANGES.map((range) => (
                    <SelectItem key={range.id} value={range.label}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
            Request Seller Access
          </Button>
        </div>
      </form>
    </Form>
  );
}
