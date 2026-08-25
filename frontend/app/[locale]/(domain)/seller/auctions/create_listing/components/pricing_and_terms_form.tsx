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
  FormDescription,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common/select';
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
  TIMEZONE_OPTIONS,
  AUCTION_TYPE_OPTIONS,
} from '../../../models';
import {
  pricingAndTermsSchema,
  PricingAndTermsValues,
} from '../../../models/schema';
import { Info, Clock, AlertTriangle } from 'lucide-react';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(pricingAndTermsSchema) as any,
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
  const auctionStartDate = useWatch({
    control: form.control,
    name: 'auctionStartDate',
  });

  const startDateWarning = (() => {
    if (!auctionStartDate) return null;
    const start = new Date(auctionStartDate);
    if (isNaN(start.getTime())) return null;
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'Auction will start immediately';
    return null;
  })();

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
              <div className="space-y-4">
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

                {/* Reserve price visibility */}
                <FormField
                  control={form.control}
                  name="reservePriceVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserve Price Visibility</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap gap-3"
                        >
                          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <RadioGroupItem value="hidden" id="rp-hidden" />
                            <div>
                              <label
                                htmlFor="rp-hidden"
                                className="text-sm font-medium cursor-pointer"
                              >
                                Hidden
                              </label>
                              <p className="text-[11px] text-muted-foreground">
                                Bidders won&apos;t see your minimum price
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <RadioGroupItem value="exposed" id="rp-exposed" />
                            <div>
                              <label
                                htmlFor="rp-exposed"
                                className="text-sm font-medium cursor-pointer"
                              >
                                Exposed
                              </label>
                              <p className="text-[11px] text-muted-foreground">
                                Show bidders the minimum price
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

        {/* Auction Scheduling */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Auction Scheduling</h3>

          <div className="grid gap-6 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="auctionStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="bg-background"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Auction will automatically start at this date and time
                  </FormDescription>
                  {startDateWarning && (
                    <p className="flex items-center gap-1.5 text-amber-500 text-sm mt-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {startDateWarning}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    value={field.value ?? 'Africa/Lagos'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Auction Type */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Auction Type</h3>

          <FormField
            control={form.control}
            name="auctionType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value ?? 'timed'}
                    onValueChange={(value) =>
                      field.onChange(value as 'timed' | 'live')
                    }
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    {AUCTION_TYPE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors flex-1',
                          field.value === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-input bg-background hover:bg-muted'
                        )}
                        onClick={() => field.onChange(option.value)}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`auction-type-${option.value}`}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
