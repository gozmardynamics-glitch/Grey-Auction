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

const themes: { value: ThemeOption; label: string; preview: string }[] = [
  { value: 'light', label: 'Light', preview: 'bg-white border' },
  { value: 'dark', label: 'Dark', preview: 'bg-slate-800 border-slate-700' },
  { value: 'system', label: 'System', preview: 'bg-slate-200 border' },
];

export default function SellerPreferencesSettings() {
  // ─── Language Form ────────────────────────────────────────────────
  const languageForm = useForm<LanguagePreferenceValues>({
    resolver: zodResolver(languagePreferenceSchema),
    defaultValues: {
      language: 'English',
    },
  });

  const onSaveLanguage = () => {
    
    toast.success('Language preference saved.');
  };

  // ─── Appearance Form ──────────────────────────────────────────────
  const appearanceForm = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: 'light',
    },
  });

  const onSaveAppearance = () => {
    
    toast.success('Appearance settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Language ────────────────────────────────────────────── */}
      <Form {...languageForm}>
        <form
          onSubmit={languageForm.handleSubmit(onSaveLanguage)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Language</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={languageForm.control}
              name="language"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Preferred Language
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Choose your preferred language for the platform.
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

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Appearance ──────────────────────────────────────────── */}
      <Form {...appearanceForm}>
        <form
          onSubmit={appearanceForm.handleSubmit(onSaveAppearance)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Appearance</h3>

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
                    {themes.map((t) => (
                      <label
                        key={t.value}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors',
                          field.value === t.value
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-[100px] w-[160px] flex-col gap-2 rounded-md border p-3',
                            t.preview
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-3/4 rounded',
                              t.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'h-2 w-1/2 rounded',
                              t.value === 'dark'
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                            )}
                          />
                          <div
                            className={cn(
                              'mt-auto h-6 w-full rounded',
                              t.value === 'dark'
                                ? 'bg-slate-700'
                                : 'bg-slate-200'
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value={t.value}
                            id={`seller-theme-${t.value}`}
                          />
                          <span className="text-sm font-medium">{t.label}</span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
