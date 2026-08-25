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

const themes: { value: ThemeOption; label: string; preview: string }[] = [
  { value: 'light', label: 'Light', preview: 'bg-white border' },
  { value: 'dark', label: 'Dark', preview: 'bg-slate-800 border-slate-700' },
  { value: 'system', label: 'System', preview: 'bg-slate-200 border' },
];

export default function PreferencesSettings() {
  // ─── Website Form ──────────────────────────────────────────────────
  const websiteForm = useForm<WebsitePreferencesValues>({
    resolver: zodResolver(websitePreferencesSchema),
    defaultValues: {
      logoSize: '40 px - Medium',
      logoUrl: 'https://greyauto.com',
      faviconUrl: 'https://greyauto.com',
    },
  });

  const onSaveWebsite = (data: WebsitePreferencesValues) => {
    
    toast.success('Website preferences saved.');
  };

  // ─── Appearance Form ───────────────────────────────────────────────
  const appearanceForm = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: 'light',
    },
  });

  const onSaveAppearance = (data: AppearanceValues) => {
    
    toast.success('Appearance settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Website ───────────────────────────────────────────── */}
      <Form {...websiteForm}>
        <form
          onSubmit={websiteForm.handleSubmit(onSaveWebsite)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Website</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={websiteForm.control}
              name="logoSize"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Logo Size
                    </FormLabel>
                    <FormDescription className="text-xs">
                      The default logo size for the website.
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
                          32 px - Small
                        </SelectItem>
                        <SelectItem value="40 px - Medium">
                          40 px - Medium
                        </SelectItem>
                        <SelectItem value="48 px - Large">
                          48 px - Large
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
                      Logo URL
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set custom link for website logo in public end.
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
                      Favicon URL
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set custom link for website logo in browser tabs.
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

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Appearance ────────────────────────────────────────── */}
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
                    className="flex flex-wrap gap-4"
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
                            id={`theme-${t.value}`}
                          />
                          <span className="text-sm font-medium">
                            {t.label}
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

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
