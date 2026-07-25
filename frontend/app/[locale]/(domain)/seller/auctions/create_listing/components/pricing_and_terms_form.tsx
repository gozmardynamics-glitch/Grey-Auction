'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/common/input';
import { Textarea } from '@/shared/components/common/textarea';
import {
  Button,
  Card,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/common';
import { Checkbox } from '@/shared/components/common/checkbox';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/shared/components/common/radio-group';
import { cn } from '@/lib/utils';
import {
  AUCTION_DURATIONS,
  AuctionDuration,
  INSPECTION_DURATIONS,
  InspectionDuration,
} from '../../../models';
import {
  pricingAndTermsSchema,
  PricingAndTermsValues,
} from '../../../models/schema';
import { Info } from 'lucide-react';

interface PricingAndTermsFormProps {
  defaultValues: PricingAndTermsValues;
  onNext: (data: PricingAndTermsValues) => void;
  onBack: () => void;
}

export default function PricingAndTermsForm({
  defaultValues,
  onNext,
  onBack,
}: PricingAndTermsFormProps) {
  const form = useForm<PricingAndTermsValues>({
    resolver: zodResolver(pricingAndTermsSchema),
    defaultValues,
  });

  const hasReservePrice = useWatch({
    control: form.control,
    name: 'hasReservePrice',
  });
  const allowBuyNow = useWatch({ control: form.control, name: 'allowBuyNow' });
  const allowInspection = useWatch({
    control: form.control,
    name: 'allowInspection',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-8">
        {/* Starting Price, Bid Increment & Payment Terms */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="startingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Starting Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="numeric"
                      placeholder="₦0.00"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bidIncrement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Bid Increment</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="numeric"
                      placeholder="₦0.00"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column - Payment Terms */}
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    className="rounded-xl text-sm resize-none bg-primary/10 p-8"
                    placeholder="Describe payment terms..."
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Manage Auction */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Manage Auction</h3>

          {/* Reserve Price */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="hasReservePrice"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      Reserve price for this item?
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <span>
                              Missed if bidder needs to pay before entry.
                            </span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </FormItem>
              )}
            />

            {hasReservePrice && (
              <FormField
                control={form.control}
                name="reservePrice"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel required>Reserve Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        placeholder="₦0.00"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Buy Now */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allowBuyNow"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      Allow Buy Now for this item to be bought off?
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <ol>
                            <li>Missed if bidder needs to pay before entry.</li>
                            <li>Missed if bidder is charged per bid.</li>
                          </ol>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </FormItem>
              )}
            />

            {allowBuyNow && (
              <FormField
                control={form.control}
                name="buyNowPrice"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel required>Set Price for Buy Now</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        placeholder="₦0.00"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Auction Duration & Inspection */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Auction Duration */}
          <FormField
            control={form.control}
            name="auctionDuration"
            render={({ field }) => (
              <FormItem className="border p-3 rounded-xl">
                <h3 className="text-lg font-semibold">Auction Duration</h3>
                <div className="max-w-lg lg:grid-cols-5 lg:grid-rows-2 grid gap-2">
                  {AUCTION_DURATIONS.map((duration) => (
                    <Button
                      key={duration}
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        field.onChange(duration as AuctionDuration)
                      }
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        field.value === duration
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-foreground hover:bg-muted'
                      )}
                    >
                      {duration}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Inspection */}
          <Card className="space-y-4 border p-3 bg-card rounded-xl space-x-5">
            <h3 className="text-lg font-semibold">Inspection</h3>

            <FormField
              control={form.control}
              name="allowInspection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allow inspection for this item?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ? 'yes' : 'no'}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      className="flex items-center gap-4"
                    >
                      <RadioGroupItem value="yes" id="inspection-yes">
                        Yes
                      </RadioGroupItem>
                      <RadioGroupItem value="no" id="inspection-no">
                        No
                      </RadioGroupItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {allowInspection && (
              <>
                <FormField
                  control={form.control}
                  name="inspectionAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Inspection Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter inspection address"
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inspectionDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspection Duration</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {INSPECTION_DURATIONS.map((duration) => (
                          <Button
                            key={duration}
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              field.onChange(duration as InspectionDuration)
                            }
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                              field.value === duration
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-background text-foreground hover:bg-muted'
                            )}
                          >
                            {duration}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="xl"
            type="button"
            onClick={onBack}
            className="gap-2"
          >
            ← Back
          </Button>
          <Button type="submit" size="xl">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
