'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { ApiError, apiFetch } from '@/shared/utils/api-client';
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
  buyerProfileSchema,
  buyerAddressSchema,
  type BuyerProfileValues,
  type BuyerAddressValues,
} from '../../models/schema';

/** Wire shape of GET /auth/me. */
interface MyProfile {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

/** Split a stored display name back into the two form fields. */
function splitName(name?: string | null): { firstName: string; lastName: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** Split "+2348012345678" into the country code and the local number. */
function splitPhone(phone?: string | null): { phoneCode: string; phone: string } {
  const value = (phone || '').trim();
  const match = value.match(/^(\+\d{1,4})(.*)$/);
  if (!match) return { phoneCode: '+234', phone: value };
  return { phoneCode: match[1], phone: match[2].trim() };
}

export default function BuyerAccountModule() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  // ─── Profile Info Form ────────────────────────────────────────────
  const profileForm = useForm<BuyerProfileValues>({
    resolver: zodResolver(buyerProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneCode: '+234',
      phone: '',
    },
  });

  const addressForm = useForm<BuyerAddressValues>({
    resolver: zodResolver(buyerAddressSchema),
    defaultValues: {
      country: '',
      streetAddress: '',
      state: '',
      city: '',
    },
  });

  // Fill the forms from the account, not from demo data: the fields used to be
  // pre-filled with someone else's name and phone number.
  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;

    apiFetch<{ data?: MyProfile }>('auth/me')
      .then((json) => {
        if (cancelled) return;
        const me = json?.data;
        if (!me) return;
        const { firstName, lastName } = splitName(me.name);
        const { phoneCode, phone } = splitPhone(me.phone);
        profileForm.reset({ firstName, lastName, email: me.email || '', phoneCode, phone });
        // The account stores a single address line; put it where the user edits it.
        addressForm.reset({
          country: '',
          state: '',
          city: '',
          streetAddress: me.address || '',
        });
      })
      .catch(() => {
        // Leave the forms empty rather than inventing values.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, profileForm, addressForm]);

  const onSaveProfile = async (data: BuyerProfileValues) => {
    try {
      // Only the fields the API accepts: the email is the account identifier and
      // is changed through verification, not this form. Sending it was rejected
      // outright, and the failure was reported as success.
      await apiFetch('auth/profile', {
        method: 'POST',
        body: {
          name: `${data.firstName} ${data.lastName}`.trim(),
          phone: `${data.phoneCode}${data.phone}`,
        },
      });
      toast.success('Profile information saved.');
    } catch (err: unknown) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.',
      );
    }
  };

  const onSaveAddress = async (data: BuyerAddressValues) => {
    try {
      // The account stores one address string, so compose it from the parts.
      // The old payload used four column names the API does not have, so every
      // save was rejected while the screen claimed success.
      const address = [data.streetAddress, data.city, data.state, data.country]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(', ');

      await apiFetch('auth/profile', { method: 'POST', body: { address } });
      toast.success('Address information saved.');
    } catch (err: unknown) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not save your address. Please try again.',
      );
    }
  };

  const firstName = useWatch({ control: profileForm.control, name: 'firstName' }) || '';
  const lastName = useWatch({ control: profileForm.control, name: 'lastName' }) || '';
  const email = useWatch({ control: profileForm.control, name: 'email' }) || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`;

  return (
    <div className="space-y-8 p-6">
      {/* Avatar + Name + Account Type */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {firstName} {lastName}
          </h3>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="outline" className="mt-1">
            {loading ? 'Loading account…' : 'Account Type: Buyer'}
          </Badge>
        </div>
      </div>

      {/* ─── Profile Information ──────────────────────────────────── */}
      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(onSaveProfile)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Profile Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={profileForm.control}
              name="firstName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      First Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your legal first name.
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
              control={profileForm.control}
              name="lastName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Last Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your legal last name.
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
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Email Address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your account email address.
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
              control={profileForm.control}
              name="phone"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Phone Number
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your contact phone number.
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
                            <SelectTrigger className="w-[90px]">
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
                        <Input className="flex-1" {...field} />
                      </FormControl>
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

      {/* ─── Address ─────────────────────────────────────────────── */}
      <Form {...addressForm}>
        <form
          onSubmit={addressForm.handleSubmit(onSaveAddress)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={addressForm.control}
              name="country"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Country
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your country of residence.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                        <SelectItem value="United States">
                          United States
                        </SelectItem>
                        <SelectItem value="United Kingdom">
                          United Kingdom
                        </SelectItem>
                        <SelectItem value="Belgium">Belgium</SelectItem>
                        <SelectItem value="Cameroon">Cameroon</SelectItem>
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
                      Street Address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your street address for shipping.
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
              control={addressForm.control}
              name="state"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">State</FormLabel>
                    <FormDescription className="text-xs">
                      Your state or province.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                </>
              )}
            />

            <FormField
              control={addressForm.control}
              name="city"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">City</FormLabel>
                    <FormDescription className="text-xs">
                      Your city or locality.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
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
