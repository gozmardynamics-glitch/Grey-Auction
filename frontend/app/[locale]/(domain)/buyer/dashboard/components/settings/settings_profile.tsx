'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ApiError, apiFetch } from '@/shared/utils/api-client';

import {
  Button,
  // Card,
  Form,
  FormControl,
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
  // TypographyH4,
  // TypographySmall,
} from '@/shared/components/common';

import {
  buyerProfileSchema,
  buyerAddressSchema,
  type BuyerProfileValues,
  type BuyerAddressValues,
} from '../../../models/schema';

interface MyProfile {
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

function splitName(name?: string | null): { firstName: string; lastName: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function splitPhone(phone?: string | null): { phoneCode: string; phone: string } {
  const value = (phone || '').trim();
  const match = value.match(/^(\+\d{1,4})(.*)$/);
  if (!match) return { phoneCode: '+234', phone: value };
  return { phoneCode: match[1], phone: match[2].trim() };
}

export default function SettingsProfile() {
  const t = useTranslations('buyer.settings.profile');
  const { status } = useSession();

  const profileForm = useForm<BuyerProfileValues>({
    resolver: zodResolver(buyerProfileSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phoneCode: '+234', phone: '' },
  });

  const addressForm = useForm<BuyerAddressValues>({
    resolver: zodResolver(buyerAddressSchema),
    defaultValues: { country: '', streetAddress: '', state: '', city: '' },
  });

  // Load the account's real values. These forms were pre-filled with a made-up
  // customer and their saves were rejected (the payload sent form keys the API
  // does not accept) while still toasting success.
  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    apiFetch<{ data?: MyProfile }>('auth/me')
      .then((json) => {
        const me = json?.data;
        if (cancelled || !me) return;
        const { firstName, lastName } = splitName(me.name);
        const { phoneCode, phone } = splitPhone(me.phone);
        profileForm.reset({ firstName, lastName, email: me.email || '', phoneCode, phone });
        addressForm.reset({ country: '', state: '', city: '', streetAddress: me.address || '' });
      })
      .catch(() => {
        /* leave the forms empty rather than inventing values */
      });
    return () => {
      cancelled = true;
    };
  }, [status, profileForm, addressForm]);

  const onSaveProfile = async (data: BuyerProfileValues) => {
    try {
      // Only DTO fields: the email identifies the account and is not editable here.
      await apiFetch('auth/profile', {
        method: 'POST',
        body: {
          name: `${data.firstName} ${data.lastName}`.trim(),
          phone: `${data.phoneCode}${data.phone}`,
        },
      });
      toast.success(t('profileSaved'));
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : t('profileSaveFailed'));
    }
  };

  const onSaveAddress = async (data: BuyerAddressValues) => {
    try {
      const address = [data.streetAddress, data.city, data.state, data.country]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(', ');
      await apiFetch('auth/profile', { method: 'POST', body: { address } });
      toast.success(t('addressSaved'));
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : t('addressSaveFailed'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(onSaveProfile)}
          className="space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={profileForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('firstName')}</FormLabel>
                  <FormControl>
                    <Input className="bg-card" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lastName')}</FormLabel>
                  <FormControl>
                    <Input className="bg-card" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailAddress')}</FormLabel>
                  <FormControl>
                    <Input className="bg-card" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneNumber')}</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={profileForm.control}
                      name="phoneCode"
                      render={({ field: codeField }) => (
                        <Select
                          value={codeField.value}
                          onValueChange={codeField.onChange}
                        >
                          <SelectTrigger className="bg-card w-[56]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+234">+234</SelectItem>
                            <SelectItem value="+1">+1</SelectItem>
                            <SelectItem value="+44">+44</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormControl>
                      <Input className="bg-card flex-1" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Address Section - nested inside same visual flow */}
        </form>
      </Form>

      <Form {...addressForm}>
        <form
          onSubmit={addressForm.handleSubmit(onSaveAddress)}
          className="space-y-5"
        >
          <FormField
            control={addressForm.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('country')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="United States">
                      🇺🇸 United States
                    </SelectItem>
                    <SelectItem value="United Kingdom">
                      🇬🇧 United Kingdom
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={addressForm.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('streetAddress')}</FormLabel>
                <FormControl>
                  <Input className="bg-card" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={addressForm.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('state')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Lagos">Lagos</SelectItem>
                      <SelectItem value="Abuja">Abuja</SelectItem>
                      <SelectItem value="Rivers">Rivers</SelectItem>
                      <SelectItem value="Oyo">Oyo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addressForm.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('city')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Lekki">Lekki</SelectItem>
                      <SelectItem value="Victoria Island">
                        Victoria Island
                      </SelectItem>
                      <SelectItem value="Ikeja">Ikeja</SelectItem>
                      <SelectItem value="Ikoyi">Ikoyi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>
      {/* <Card className="flex items-center justify-between p-3">
        <div>
          <TypographyH4>Delete Account</TypographyH4>
          <TypographySmall>
            {' '}
            Deleting your account will permanently remove your profile and
            associated data from Grey Auctions
          </TypographySmall>
        </div>

        <Button
          size="xl"
          variant="outline"
          className="border-destructive text-destructive"
        >
          Delete Account
        </Button>
      </Card> */}
    </div>
  );
}
