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
      toast.success('Site configuration saved.');
    } catch (error) {
      console.error('Failed to save site config:', error);
      toast.error('Failed to save site configuration.');
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
      toast.success('Timezone and format saved.');
    } catch (error) {
      console.error('Failed to save timezone:', error);
      toast.error('Failed to save timezone settings.');
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
      toast.success('Language settings saved.');
    } catch (error) {
      console.error('Failed to save language:', error);
      toast.error('Failed to save language settings.');
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
      toast.success('Country settings saved.');
    } catch (error) {
      console.error('Failed to save country:', error);
      toast.error('Failed to save country settings.');
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
          <h3 className="text-base font-semibold">Site Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={siteForm.control}
              name="siteName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Site Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the name of your site.
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
                      Site URL
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the key of your site url address.
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
                      Administration Email Address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the administration email address.
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
                      Site Phone Number
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the phone number of your site.
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
                      Copyright
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Copyright information of your site.
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
                      Site Description
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Describe your site information.
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
                      Allow Registration
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable or disable registration from site.
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
                            Enable
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="invite-only" id="reg-invite" />
                          <Label
                            htmlFor="reg-invite"
                            className="text-sm cursor-pointer"
                          >
                            Invite Only
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="disable" id="reg-disable" />
                          <Label
                            htmlFor="reg-disable"
                            className="text-sm cursor-pointer"
                          >
                            Disable
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
                      Maintenance Mode
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable to make website offline.
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
                        Offline
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

      {/* ─── Timezone and Format ───────────────────────────────── */}
      <Form {...timezoneForm}>
        <form
          onSubmit={timezoneForm.handleSubmit(onSaveTimezone)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Timezone and Format</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={timezoneForm.control}
              name="timeZone"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Time Zone
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set time zone on application.
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
                      Date Format
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set date format to display date.
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
                      Time Format
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set time format to display time.
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
                          12-hour (11:23 AM)
                        </SelectItem>
                        <SelectItem value="23:23">24-hour (23:23)</SelectItem>
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

      {/* ─── Language ──────────────────────────────────────────── */}
      <Form {...languageForm}>
        <form
          onSubmit={languageForm.handleSubmit(onSaveLanguage)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Language</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={languageForm.control}
              name="defaultLanguage"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Default Language
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Set default language on application.
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

            <FormField
              control={languageForm.control}
              name="languageSwitcher"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Language Switcher
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Display a switcher to quick switch language.
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

      {/* ─── Country ───────────────────────────────────────────── */}
      <Form {...countryForm}>
        <form
          onSubmit={countryForm.handleSubmit(onSaveCountry)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Country</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={countryForm.control}
              name="countryRestriction"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Country Restriction
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Allow or disallowed the countries into application.
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
                          Allow All Countries
                        </SelectItem>
                        <SelectItem value="Restrict Selected Countries">
                          Restrict Selected Countries
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
                      Choose Countries
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the countries you want to restrict from the list.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Type country names..."  />
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
