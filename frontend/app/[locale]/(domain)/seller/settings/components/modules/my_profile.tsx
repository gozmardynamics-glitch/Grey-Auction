'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/shared/components/common';
import {
  profileInfoSchema,
  profileAddressSchema,
  type ProfileInfoValues,
  type ProfileAddressValues,
} from '../../../models/schema';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

/** `country` on the seller profile is ISO 3166-1 alpha-2 (Length(2,2) in the DTO). */
const COUNTRY_OPTIONS: Record<string, string> = {
  NG: 'Nigeria',
  US: 'United States',
  GB: 'United Kingdom',
  BE: 'Belgium',
  CM: 'Cameroon',
};

const PHONE_CODES = ['+234', '+1', '+44', '+32'];
const STATES = ['Lagos', 'Abuja', 'Rivers', 'Oyo'];
const CITIES = ['Lekki', 'Victoria Island', 'Ikeja', 'Ikoyi'];

/** Keeps a stored value selectable even when it is not one of the canned options. */
const withCurrent = (options: string[], current?: string | null): string[] =>
  current && !options.includes(current) ? [current, ...options] : options;

const countryLabel = (code: string): string => COUNTRY_OPTIONS[code] ?? code;

const toIsoCountry = (value?: string | null): string => {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  if (raw.length === 2) return raw.toUpperCase();
  const match = Object.entries(COUNTRY_OPTIONS).find(
    ([, label]) => label.toLowerCase() === raw.toLowerCase(),
  );
  return match ? match[0] : raw;
};

const splitPhone = (raw?: string | null): { phoneCode: string; phone: string } => {
  const value = (raw ?? '').trim();
  if (!value) return { phoneCode: '+234', phone: '' };
  const code = PHONE_CODES.find((candidate) => value.startsWith(candidate));
  if (!code) return { phoneCode: '+234', phone: value.replace(/^\+/, '') };
  return { phoneCode: code, phone: value.slice(code.length) };
};

interface SellerProfile {
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export default function MyProfileSettings() {
  const t = useTranslations('seller.settings.myProfile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // ─── Profile Info Form ────────────────────────────────────────────
  const profileForm = useForm<ProfileInfoValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      shopName: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneCode: '+234',
      phone: '',
    },
  });

  // ─── Address Form ────────────────────────────────────────────────
  const addressForm = useForm<ProfileAddressValues>({
    resolver: zodResolver(profileAddressSchema),
    defaultValues: {
      country: 'NG',
      streetAddress: '',
      state: '',
      city: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiFetch<{ data?: SellerProfile }>('sellers/profile/me');
        const profile = json?.data;
        if (cancelled || !profile) return;
        const { phoneCode, phone } = splitPhone(profile.phone);
        profileForm.reset({
          ...profileForm.getValues(),
          shopName: profile.business_name ?? '',
          email: profile.email ?? '',
          phoneCode,
          phone,
        });
        addressForm.reset({
          country: profile.country ?? 'NG',
          streetAddress: profile.address_line1 ?? '',
          state: profile.state ?? '',
          city: profile.city ?? '',
        });
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : 'Could not load your profile');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileForm, addressForm]);

  const onSaveProfile = async (data: ProfileInfoValues) => {
    // Only fields UpdateSellerDto accepts: the global ValidationPipe rejects
    // anything else with a 400, so empty values are dropped rather than sent.
    const body: Record<string, string> = {};
    const businessName = (data.shopName ?? '').trim();
    const email = (data.email ?? '').trim();
    const phoneDigits = (data.phone ?? '').replace(/\D/g, '');
    if (businessName) body.business_name = businessName;
    if (email) body.email = email;
    if (phoneDigits) {
      const code = (data.phoneCode ?? '').trim();
      body.phone = `${code.startsWith('+') ? code : `+${code}`}${phoneDigits}`;
    }
    // The seller record has no first/last name; the account holder's display
    // name is a user-level field, so it is saved through auth/profile.
    const name = [(data.firstName ?? '').trim(), (data.lastName ?? '').trim()]
      .filter(Boolean)
      .join(' ');

    if (!Object.keys(body).length && !name) {
      toast.error('There is nothing to save yet');
      return;
    }

    setSavingProfile(true);
    try {
      if (Object.keys(body).length) {
        await apiFetch('sellers/profile/me', { method: 'PATCH', body });
      }
      if (name) {
        await apiFetch('auth/profile', { method: 'POST', body: { name } });
      }
      toast.success(t('profileSaved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSaveAddress = async (data: ProfileAddressValues) => {
    const body: Record<string, string> = {};
    const street = (data.streetAddress ?? '').trim();
    const city = (data.city ?? '').trim();
    const state = (data.state ?? '').trim();
    const country = toIsoCountry(data.country);
    if (street) body.address_line1 = street;
    if (city) body.city = city;
    if (state) body.state = state;
    if (country) body.country = country;

    if (!Object.keys(body).length) {
      toast.error('There is nothing to save yet');
      return;
    }

    setSavingAddress(true);
    try {
      await apiFetch('sellers/profile/me', { method: 'PATCH', body });
      toast.success(t('addressSaved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSavingAddress(false);
    }
  };

  const firstName = useWatch({ control: profileForm.control, name: 'firstName' }) || '';
  const lastName = useWatch({ control: profileForm.control, name: 'lastName' }) || '';
  const email = useWatch({ control: profileForm.control, name: 'email' }) || '';
  const shopName = useWatch({ control: profileForm.control, name: 'shopName' }) || '';
  const initials =
    `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() ||
    (shopName[0] || '').toUpperCase();

  return (
    <div className="space-y-8 p-6">
      {/* Avatar + Name + Account Type */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {shopName}
          </h3>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="outline" className="mt-1">
            {t('accountTypeBadge')}
          </Badge>
        </div>
      </div>

      {/* ─── Profile Information ──────────────────────────────────── */}
      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(onSaveProfile)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('profileInformation')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={profileForm.control}
              name="shopName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('shopName')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('shopNameDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={profileForm.control}
              name="firstName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('firstName')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('firstNameDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={profileForm.control}
              name="lastName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('lastName')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('lastNameDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('email')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('emailDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={profileForm.control}
              name="phone"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('phone')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('phoneDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <div className="flex gap-2">
                      <FormField
                        control={profileForm.control}
                        name="phoneCode"
                        render={({ field: codeField }) => (
                          <Select
                            value={codeField.value}
                            onValueChange={codeField.onChange}
                          >
                            <SelectTrigger className="bg-background w-[90px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+234">+234</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+32">+32</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FormControl>
                        <Input className="bg-background flex-1" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit" disabled={savingProfile}>
            {t('saveChanges')}
          </Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Address ─────────────────────────────────────────────── */}
      <Form {...addressForm}>
        <form
          onSubmit={addressForm.handleSubmit(onSaveAddress)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('address')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={addressForm.control}
              name="country"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('country')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('countryDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withCurrent(Object.keys(COUNTRY_OPTIONS), field.value).map(
                          (code) => (
                            <SelectItem key={code} value={code}>
                              {countryLabel(code)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={addressForm.control}
              name="streetAddress"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('streetAddress')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('streetAddressDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={addressForm.control}
              name="state"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">{t('state')}</FormLabel>
                    <FormDescription className="text-xs">
                      {t('stateDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withCurrent(STATES, field.value).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={addressForm.control}
              name="city"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">{t('city')}</FormLabel>
                    <FormDescription className="text-xs">
                      {t('cityDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withCurrent(CITIES, field.value).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit" disabled={savingAddress}>
            {t('saveChanges')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
