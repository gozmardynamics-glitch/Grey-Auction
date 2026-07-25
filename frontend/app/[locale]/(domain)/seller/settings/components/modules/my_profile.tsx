'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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

export default function MyProfileSettings() {
  // ─── Profile Info Form ────────────────────────────────────────────
  const profileForm = useForm<ProfileInfoValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      shopName: 'Jayden Auto',
      firstName: 'Jayden',
      lastName: 'Nicholas',
      email: 'jaydennicholas@gmail.com',
      phoneCode: '+234',
      phone: '08143601064',
    },
  });

  const onSaveProfile = (data: ProfileInfoValues) => {
    console.log('Saving profile info:', data);
    toast.success('Profile information saved.');
  };

  // ─── Address Form ────────────────────────────────────────────────
  const addressForm = useForm<ProfileAddressValues>({
    resolver: zodResolver(profileAddressSchema),
    defaultValues: {
      country: 'Nigeria',
      streetAddress: 'Victoria Crest Estate',
      state: 'Lagos',
      city: 'Lekki',
    },
  });

  const onSaveAddress = (data: ProfileAddressValues) => {
    console.log('Saving address:', data);
    toast.success('Address information saved.');
  };

  const firstName = profileForm.watch('firstName') || '';
  const lastName = profileForm.watch('lastName') || '';
  const email = profileForm.watch('email') || '';
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
            {profileForm.watch('shopName')}
          </h3>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="outline" className="mt-1">
            Account Type: Individual
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
              name="shopName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Shop Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      The name displayed on your seller profile.
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
                      First Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your legal first name.
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
                      Last Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your legal last name.
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
                      Email Address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Your account email address.
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
                        <SelectTrigger className="bg-background">
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
                        <SelectTrigger className="bg-background">
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
                        <SelectTrigger className="bg-background">
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
