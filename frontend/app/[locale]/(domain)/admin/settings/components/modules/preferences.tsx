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
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';
import {
  websitePreferencesSchema,
  appearanceSchema,
  type WebsitePreferencesValues,
  type AppearanceValues,
} from '../../../models/schema';

type ThemeOption = 'light' | 'dark' | 'system';

const themes: { value: ThemeOption; labelKey: string; preview: string }[] = [
  { value: 'light', labelKey: 'themeLight', preview: 'bg-white border' },
  { value: 'dark', labelKey: 'themeDark', preview: 'bg-slate-800 border-slate-700' },
  { value: 'system', labelKey: 'themeSystem', preview: 'bg-slate-200 border' },
];

export default function PreferencesSettings() {
  const t = useTranslations('admin.settings.preferences');
  // ─── Website Form ──────────────────────────────────────────────────
  const websiteForm = useForm<WebsitePreferencesValues>({
    resolver: zodResolver(websitePreferencesSchema),
    defaultValues: {
      logoSize: '40 px - Medium',
      logoUrl: 'https://greyauto.com',
      faviconUrl: 'https://greyauto.com',
    },
  });

  const onSaveWebsite = () => {
    
    toast.success(t('websiteSaved'));
  };

  // ─── Appearance Form ───────────────────────────────────────────────
  const appearanceForm = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: 'light',
    },
  });

  const onSaveAppearance = () => {
    
    toast.success(t('appearanceSaved'));
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Website ───────────────────────────────────────────── */}
      <Form {...websiteForm}>
        <form
          onSubmit={websiteForm.handleSubmit(onSaveWebsite)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('website')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={websiteForm.control}
              name="logoSize"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('logoSize')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('logoSizeHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="32 px - Small">
                          {t('logoSmall')}
                        </SelectItem>
                        <SelectItem value="40 px - Medium">
                          {t('logoMedium')}
                        </SelectItem>
                        <SelectItem value="48 px - Large">
                          {t('logoLarge')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={websiteForm.control}
              name="logoUrl"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('logoUrl')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('logoUrlHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={websiteForm.control}
              name="faviconUrl"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('faviconUrl')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('faviconUrlHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
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

      <Separator />

      {/* ─── Appearance ────────────────────────────────────────── */}
      <Form {...appearanceForm}>
        <form
          onSubmit={appearanceForm.handleSubmit(onSaveAppearance)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('appearance')}</h3>

          <FormField
            control={appearanceForm.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-4"
                  >
                    {themes.map((item) => (
                      <label
                        key={item.value}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors',
                          field.value === item.value
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-[100px] w-[160px] flex-col gap-2 rounded-md border p-3',
                            item.preview
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-3/4 rounded',
                              item.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'h-2 w-1/2 rounded',
                              item.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'mt-auto h-6 w-full rounded',
                              item.value === 'dark'
                                ? 'bg-slate-700'
                                : 'bg-slate-200'
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value={item.value}
                            id={`theme-${item.value}`}
                          />
                          <span className="text-sm font-medium">
                            {t(item.labelKey)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>
    </div>
  );
}
