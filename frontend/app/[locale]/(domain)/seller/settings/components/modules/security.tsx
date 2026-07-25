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
  Separator,
  Switch,
} from '@/shared/components/common';
import {
  changePasswordSchema,
  withdrawalPinSchema,
  securityOptionsSchema,
  type ChangePasswordValues,
  type WithdrawalPinValues,
  type SecurityOptionsValues,
} from '../../../models/schema';

export default function SellerSecuritySettings() {
  // ─── Change Password Form ────────────────────────────────────────
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSavePassword = (data: ChangePasswordValues) => {
    console.log('Changing password:', data);
    toast.success('Password changed successfully.');
    passwordForm.reset();
  };

  // ─── Withdrawal PIN Form ─────────────────────────────────────────
  const pinForm = useForm<WithdrawalPinValues>({
    resolver: zodResolver(withdrawalPinSchema),
    defaultValues: {
      currentPin: '',
      newPin: '',
      confirmPin: '',
    },
  });

  const onSavePin = (data: WithdrawalPinValues) => {
    console.log('Changing withdrawal PIN:', data);
    toast.success('Withdrawal PIN changed successfully.');
    pinForm.reset();
  };

  // ─── Security Options Form ───────────────────────────────────────
  const securityForm = useForm<SecurityOptionsValues>({
    resolver: zodResolver(securityOptionsSchema),
    defaultValues: {
      twoFactorAuth: false,
    },
  });

  const onSaveSecurity = (data: SecurityOptionsValues) => {
    console.log('Saving security options:', data);
    toast.success('Security options saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Change Password ─────────────────────────────────────── */}
      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(onSavePassword)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Change Password</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Current Password
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enter your current account password.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      New Password
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Must be at least 8 characters long.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Confirm Password
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Re-enter your new password to confirm.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Change Password</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Change Withdrawal PIN ───────────────────────────────── */}
      <Form {...pinForm}>
        <form
          onSubmit={pinForm.handleSubmit(onSavePin)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Change Withdrawal PIN</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={pinForm.control}
              name="currentPin"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Current PIN
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enter your current 4-digit withdrawal PIN.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={pinForm.control}
              name="newPin"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      New PIN
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enter a new 4-digit withdrawal PIN.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={pinForm.control}
              name="confirmPin"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Confirm PIN
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Re-enter your new PIN to confirm.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Change PIN</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Security Options ────────────────────────────────────── */}
      <Form {...securityForm}>
        <form
          onSubmit={securityForm.handleSubmit(onSaveSecurity)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Security Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={securityForm.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Two-Factor Authentication
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Add an extra layer of security to your account.
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

      {/* ─── Account Actions ─────────────────────────────────────── */}
      <div className="space-y-0">
        <h3 className="text-base font-semibold mb-2">Account Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          <div>
            <p className="text-sm font-medium">Disable Account</p>
            <p className="text-xs text-muted-foreground">
              Temporarily restrict access to your profile, listings, and
              transactions.
            </p>
          </div>
          <div>
            <Button variant="outline">Disable Account</Button>
          </div>

          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove your profile and associated data from Grey
              Auctions.
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
