'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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

export default function SettingsProfile() {
  const profileForm = useForm<BuyerProfileValues>({
    resolver: zodResolver(buyerProfileSchema),
    defaultValues: {
      firstName: 'Jayden',
      lastName: 'Nicholas',
      email: 'jaydennicholas@gmail.com',
      phoneCode: '+234',
      phone: '08143601064',
    },
  });

  const addressForm = useForm<BuyerAddressValues>({
    resolver: zodResolver(buyerAddressSchema),
    defaultValues: {
      country: 'Nigeria',
      streetAddress: 'Victoria Crest Estate',
      state: 'Lagos',
      city: 'Lekki',
    },
  });

  const onSaveProfile = (data: BuyerProfileValues) => {
    console.log('Saving profile:', data);
    toast.success('Profile information saved.');
  };

  const onSaveAddress = (data: BuyerAddressValues) => {
    console.log('Saving address:', data);
    toast.success('Address information saved.');
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
                  <FormLabel>First Name</FormLabel>
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
                  <FormLabel>Last Name</FormLabel>
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
                  <FormLabel>Email Address</FormLabel>
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
                  <FormLabel>Phone Number</FormLabel>
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
                <FormLabel>Country</FormLabel>
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
                <FormLabel>Street Address</FormLabel>
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
                  <FormLabel>State</FormLabel>
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
                  <FormLabel>City</FormLabel>
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

          <Button type="submit">Save Changes</Button>
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
