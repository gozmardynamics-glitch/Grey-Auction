'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  Switch,
} from '@/shared/components/common';
import {
  auctionSettingsSchema,
  auctionAdvancedSchema,
  type AuctionSettingsValues,
  type AuctionAdvancedValues,
} from '../../../models/schema';

export default function AuctionsSettings() {
  // ─── Settings Form ─────────────────────────────────────────────────
  const settingsForm = useForm<AuctionSettingsValues>({
    resolver: zodResolver(auctionSettingsSchema),
    defaultValues: {
      minDuration: '1 Day',
      maxDuration: '14 Days',
      bidIncrement: '10%',
      autoCloseOnEndTime: false,
      autoCloseOnEndTime2: false,
    },
  });

  const onSaveSettings = (data: AuctionSettingsValues) => {
    
    toast.success('Auction settings saved.');
  };

  // ─── Advanced Form ─────────────────────────────────────────────────
  const advancedForm = useForm<AuctionAdvancedValues>({
    resolver: zodResolver(auctionAdvancedSchema),
    defaultValues: {
      autoRejectUnpaid: '14 Days',
    },
  });

  const onSaveAdvanced = (data: AuctionAdvancedValues) => {
    
    toast.success('Advanced auction settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Settings ──────────────────────────────────────────── */}
      <Form {...settingsForm}>
        <form
          onSubmit={settingsForm.handleSubmit(onSaveSettings)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={settingsForm.control}
              name="minDuration"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Minimum Auction Duration
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the lowest duration for auctions.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input   {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={settingsForm.control}
              name="maxDuration"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Maximum Auction Duration
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the highest duration for auctions.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input   {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={settingsForm.control}
              name="bidIncrement"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Bid Increment
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the minimum price increase on bid placement.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input   {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={settingsForm.control}
              name="autoCloseOnEndTime"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Auto-close Auction on End Time
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable to make auction end.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        Enable
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={settingsForm.control}
              name="autoCloseOnEndTime2"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Auto-close Auction on End Time
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable to make auction end.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        Enable
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Advanced ──────────────────────────────────────────── */}
      <Form {...advancedForm}>
        <form
          onSubmit={advancedForm.handleSubmit(onSaveAdvanced)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Advanced</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={advancedForm.control}
              name="autoRejectUnpaid"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Auto-reject Unpaid Winning Bids
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the duration to reject unpaid winning bids.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input   {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
