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
  languagePreferenceSchema,
  appearanceSchema,
  type LanguagePreferenceValues,
  type AppearanceValues,
} from '../../../models/schema';

type ThemeOption = 'light' | 'dark' | 'system';

const themes: { value: ThemeOption; labelKey: string; preview: string }[] = [
  { value: 'light', labelKey: 'themeLight', preview: 'bg-white border' },
  { value: 'dark', labelKey: 'themeDark', preview: 'bg-slate-800 border-slate-700' },
  { value: 'system', labelKey: 'themeSystem', preview: 'bg-slate-200 border' },
];

export default function SellerPreferencesSettings() {
  const t = useTranslations('seller.settings.preferences');

  // ─── Language Form ────────────────────────────────────────────────
  const languageForm = useForm<LanguagePreferenceValues>({
    resolver: zodResolver(languagePreferenceSchema),
    defaultValues: {
      language: 'English',
    },
  });

  const onSaveLanguage = () => {
    
    toast.success(t('languageSaved'));
  };

  // ─── Appearance Form ──────────────────────────────────────────────
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
      {/* ─── Language ────────────────────────────────────────────── */}
      <Form {...languageForm}>
        <form
          onSubmit={languageForm.handleSubmit(onSaveLanguage)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('language')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={languageForm.control}
              name="language"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('preferredLanguage')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('preferredLanguageDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="Arabic">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
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

      {/* ─── Appearance ──────────────────────────────────────────── */}
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
                    className="flex gap-4"
                  >
                    {themes.map((theme) => (
                      <label
                        key={theme.value}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors',
                          field.value === theme.value
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-[100px] w-[160px] flex-col gap-2 rounded-md border p-3',
                            theme.preview
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-3/4 rounded',
                              theme.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'h-2 w-1/2 rounded',
                              theme.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'mt-auto h-6 w-full rounded',
                              theme.value === 'dark'
                                ? 'bg-slate-700'
                                : 'bg-slate-200'
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value={theme.value}
                            id={`seller-theme-${theme.value}`}
                          />
                          <span className="text-sm font-medium">{t(theme.labelKey)}</span>
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
