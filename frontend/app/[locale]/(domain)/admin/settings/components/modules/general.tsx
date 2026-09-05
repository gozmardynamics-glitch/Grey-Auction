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
  Switch,
  Textarea,
  Label,
} from '@/shared/components/common';
import {
  siteConfigSchema,
  timezoneFormatSchema,
  languageSchema,
  countrySchema,
  type SiteConfigValues,
  type TimezoneFormatValues,
  type LanguageValues,
  type CountryValues,
} from '../../../models/schema';

export default function GeneralSettings() {
  const t = useTranslations('admin.settings.general');
  // ─── Site Configuration Form ────────────────────────────────────────
  const siteForm = useForm<SiteConfigValues>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      siteName: 'Grey Auto',
      siteUrl: 'https://www.greyauto.com',
      adminEmail: 'info@greyauto.com',
      sitePhone: '+25606143601064',
      copyright: '© 2019, GreyAuto. All Rights Reserved.',
      siteDescription: 'An auction website',
      allowRegistration: 'enable',
      maintenanceMode: false,
    },
  });

  const onSaveSiteConfig = async (data: SiteConfigValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'siteConfig', ...data }),
      });
      toast.success(t('siteConfigSaved'));
    } catch (error) {
      console.error('Failed to save site config:', error);
      toast.error(t('siteConfigSaveFailed'));
    }
  };

  // ─── Timezone Form ─────────────────────────────────────────────────
  const timezoneForm = useForm<TimezoneFormatValues>({
    resolver: zodResolver(timezoneFormatSchema),
    defaultValues: {
      timeZone: '(UTC+01:00) West Central Africa',
      dateFormat: '10-01-2016',
      timeFormat: '11:23 AM',
    },
  });

  const onSaveTimezone = async (data: TimezoneFormatValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'timezone', ...data }),
      });
      toast.success(t('timezoneSaved'));
    } catch (error) {
      console.error('Failed to save timezone:', error);
      toast.error(t('timezoneSaveFailed'));
    }
  };

  // ─── Language Form ─────────────────────────────────────────────────
  const languageForm = useForm<LanguageValues>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      defaultLanguage: 'English',
      languageSwitcher: true,
    },
  });

  const onSaveLanguage = async (data: LanguageValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'language', ...data }),
      });
      toast.success(t('languageSaved'));
    } catch (error) {
      console.error('Failed to save language:', error);
      toast.error(t('languageSaveFailed'));
    }
  };

  // ─── Country Form ──────────────────────────────────────────────────
  const countryForm = useForm<CountryValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      countryRestriction: 'Allow All Countries',
      chooseCountries: '',
    },
  });

  const onSaveCountry = async (data: CountryValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'country', ...data }),
      });
      toast.success(t('countrySaved'));
    } catch (error) {
      console.error('Failed to save country:', error);
      toast.error(t('countrySaveFailed'));
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Site Configuration ────────────────────────────────── */}
      <Form {...siteForm}>
        <form
          onSubmit={siteForm.handleSubmit(onSaveSiteConfig)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('siteConfig')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={siteForm.control}
              name="siteName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('siteName')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('siteNameHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field}  />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="siteUrl"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('siteUrl')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('siteUrlHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="adminEmail"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('adminEmail')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('adminEmailHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="sitePhone"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('sitePhone')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('sitePhoneHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="copyright"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('copyright')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('copyrightHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="siteDescription"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('siteDescription')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('siteDescriptionHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[60px] resize-none bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="allowRegistration"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('allowRegistration')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('allowRegistrationHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-6"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="enable" id="reg-enable" />
                          <Label
                            htmlFor="reg-enable"
                            className="text-sm cursor-pointer"
                          >
                            {t('enable')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="invite-only" id="reg-invite" />
                          <Label
                            htmlFor="reg-invite"
                            className="text-sm cursor-pointer"
                          >
                            {t('inviteOnly')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="disable" id="reg-disable" />
                          <Label
                            htmlFor="reg-disable"
                            className="text-sm cursor-pointer"
                          >
                            {t('disable')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={siteForm.control}
              name="maintenanceMode"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('maintenanceMode')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('maintenanceModeHint')}
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
                        {t('offline')}
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

      {/* ─── Timezone and Format ───────────────────────────────── */}
      <Form {...timezoneForm}>
        <form
          onSubmit={timezoneForm.handleSubmit(onSaveTimezone)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('timezoneFormat')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={timezoneForm.control}
              name="timeZone"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('timeZone')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('timeZoneHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="(UTC+01:00) West Central Africa">
                          (UTC+01:00) West Central Africa
                        </SelectItem>
                        <SelectItem value="(UTC+00:00) GMT">
                          (UTC+00:00) GMT
                        </SelectItem>
                        <SelectItem value="(UTC-05:00) Eastern Time">
                          (UTC-05:00) Eastern Time
                        </SelectItem>
                        <SelectItem value="(UTC+02:00) Central Africa Time">
                          (UTC+02:00) Central Africa Time
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={timezoneForm.control}
              name="dateFormat"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('dateFormat')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('dateFormatHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="10-01-2016">DD-MM-YYYY</SelectItem>
                        <SelectItem value="01-10-2016">MM-DD-YYYY</SelectItem>
                        <SelectItem value="2016-01-10">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={timezoneForm.control}
              name="timeFormat"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('timeFormat')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('timeFormatHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="11:23 AM">
                          {t('format12h')}
                        </SelectItem>
                        <SelectItem value="23:23">{t('format24h')}</SelectItem>
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

      {/* ─── Language ──────────────────────────────────────────── */}
      <Form {...languageForm}>
        <form
          onSubmit={languageForm.handleSubmit(onSaveLanguage)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('language')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={languageForm.control}
              name="defaultLanguage"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('defaultLanguage')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('defaultLanguageHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">{t('langEnglish')}</SelectItem>
                        <SelectItem value="French">{t('langFrench')}</SelectItem>
                        <SelectItem value="Spanish">{t('langSpanish')}</SelectItem>
                        <SelectItem value="Arabic">{t('langArabic')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={languageForm.control}
              name="languageSwitcher"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('languageSwitcher')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('languageSwitcherHint')}
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

      {/* ─── Country ───────────────────────────────────────────── */}
      <Form {...countryForm}>
        <form
          onSubmit={countryForm.handleSubmit(onSaveCountry)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('country')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={countryForm.control}
              name="countryRestriction"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('countryRestriction')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('countryRestrictionHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Allow All Countries">
                          {t('allowAllCountries')}
                        </SelectItem>
                        <SelectItem value="Restrict Selected Countries">
                          {t('restrictSelectedCountries')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={countryForm.control}
              name="chooseCountries"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('chooseCountries')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('chooseCountriesHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder={t('countriesPlaceholder')}  />
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
