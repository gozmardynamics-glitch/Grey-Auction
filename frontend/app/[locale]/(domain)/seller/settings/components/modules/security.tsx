'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
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
} from '@/shared/components/common';
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '../../../models/schema';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

/**
 * POST wallet/pin takes the new PIN alone (`SetPinDto.pin`, 4-6 digits) — the
 * wallet has no endpoint that verifies the previous PIN, so the form does not
 * ask for one.
 */
const withdrawalPinSchema = z
  .object({
    newPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
    confirmPin: z.string().min(1, 'Re-enter your new PIN'),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

type WithdrawalPinValues = z.infer<typeof withdrawalPinSchema>;

export default function SellerSecuritySettings() {
  const t = useTranslations('seller.settings.security');
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  // ─── Change Password Form ────────────────────────────────────────
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSavePassword = async (data: ChangePasswordValues) => {
    setSavingPassword(true);
    try {
      await apiFetch('auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      });
      toast.success(t('passwordChanged'));
      passwordForm.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Withdrawal PIN Form ─────────────────────────────────────────
  const pinForm = useForm<WithdrawalPinValues>({
    resolver: zodResolver(withdrawalPinSchema),
    defaultValues: {
      newPin: '',
      confirmPin: '',
    },
  });

  const onSavePin = async (data: WithdrawalPinValues) => {
    setSavingPin(true);
    try {
      await apiFetch('wallet/pin', { method: 'POST', body: { pin: data.newPin } });
      toast.success(t('pinChanged'));
      pinForm.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Change Password ─────────────────────────────────────── */}
      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(onSavePassword)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('changePassword')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('currentPassword')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('currentPasswordDesc')}
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
                      {t('newPassword')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('newPasswordDesc')}
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
                      {t('confirmPassword')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('confirmPasswordDesc')}
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

          <Button type="submit" disabled={savingPassword}>
            {t('changePasswordSubmit')}
          </Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Change Withdrawal PIN ───────────────────────────────── */}
      <Form {...pinForm}>
        <form
          onSubmit={pinForm.handleSubmit(onSavePin)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('changePin')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={pinForm.control}
              name="newPin"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('newPin')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('newPinDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
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
                      {t('confirmPin')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('confirmPinDesc')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        className="bg-background"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
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

          <Button type="submit" disabled={savingPin}>
            {t('changePinSubmit')}
          </Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Security Options ────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t('securityOptions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-1">
          <p className="text-sm font-medium">{t('twoFactor')}</p>
          <div>
            <p className="text-xs text-muted-foreground">{t('twoFactorDesc')}</p>
            <p className="text-xs text-muted-foreground">
              Two-factor authentication is not configurable from seller settings.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ─── Account Actions ─────────────────────────────────────── */}
      <div className="space-y-0">
        <h3 className="text-base font-semibold mb-2">{t('accountActions')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          <div>
            <p className="text-sm font-medium">{t('disableAccount')}</p>
            <p className="text-xs text-muted-foreground">
              {t('disableAccountDesc')}
            </p>
          </div>
          <div>
            <Button variant="outline">{t('disableAccount')}</Button>
          </div>

          <div>
            <p className="text-sm font-medium">{t('deleteAccount')}</p>
            <p className="text-xs text-muted-foreground">
              {t('deleteAccountDesc')}
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
