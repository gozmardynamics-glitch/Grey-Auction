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
  const t = useTranslations('seller.settings.security');

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
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('passwordChangeFailedShort'));
      }
      toast.success(t('passwordChanged'));
      passwordForm.reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('passwordChangeFailed'));
    }
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

  const onSavePin = () => {
    
    toast.success(t('pinChanged'));
    pinForm.reset();
  };

  // ─── Security Options Form ───────────────────────────────────────
  const securityForm = useForm<SecurityOptionsValues>({
    resolver: zodResolver(securityOptionsSchema),
    defaultValues: {
      twoFactorAuth: false,
    },
  });

  const onSaveSecurity = () => {
    
    toast.success(t('securitySaved'));
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

          <Button type="submit">{t('changePasswordSubmit')}</Button>
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
              name="currentPin"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('currentPin')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('currentPinDesc')}
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

          <Button type="submit">{t('changePinSubmit')}</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Security Options ────────────────────────────────────── */}
      <Form {...securityForm}>
        <form
          onSubmit={securityForm.handleSubmit(onSaveSecurity)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('securityOptions')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={securityForm.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('twoFactor')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('twoFactorDesc')}
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
