'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('admin.settings.auctions');
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

  const onSaveSettings = () => {
    
    toast.success(t('settingsSaved'));
  };

  // ─── Advanced Form ─────────────────────────────────────────────────
  const advancedForm = useForm<AuctionAdvancedValues>({
    resolver: zodResolver(auctionAdvancedSchema),
    defaultValues: {
      autoRejectUnpaid: '14 Days',
    },
  });

  const onSaveAdvanced = () => {
    
    toast.success(t('advancedSaved'));
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Settings ──────────────────────────────────────────── */}
      <Form {...settingsForm}>
        <form
          onSubmit={settingsForm.handleSubmit(onSaveSettings)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('settings')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={settingsForm.control}
              name="minDuration"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('minDuration')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('minDurationHint')}
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
                      {t('maxDuration')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('maxDurationHint')}
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
                      {t('bidIncrement')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('bidIncrementHint')}
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
                      {t('autoCloseOnEndTime')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('autoCloseOnEndTimeHint')}
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
                        {t('enable')}
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
                      {t('autoCloseOnEndTime')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('autoCloseOnEndTimeHint')}
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
                        {t('enable')}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Advanced ──────────────────────────────────────────── */}
      <Form {...advancedForm}>
        <form
          onSubmit={advancedForm.handleSubmit(onSaveAdvanced)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('advanced')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={advancedForm.control}
              name="autoRejectUnpaid"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('autoRejectUnpaid')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('autoRejectUnpaidHint')}
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

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>
    </div>
  );
}
