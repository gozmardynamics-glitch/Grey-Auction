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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from '@/shared/components/common';
import {
  authenticationSchema,
  securityAdvancedSchema,
  type AuthenticationValues,
  type SecurityAdvancedValues,
} from '../../../models/schema';

export default function SecuritySettings() {
  const t = useTranslations('admin.settings.security');
  // ─── Authentication Form ───────────────────────────────────────────
  const authForm = useForm<AuthenticationValues>({
    resolver: zodResolver(authenticationSchema),
    defaultValues: {
      sessionTimeout: '15 Minutes',
      loginAttempts: '5',
      passwordLength: '8 Characters',
      uppercaseLetterNumber: false,
      specialCharacter: false,
      twoFactorAuth: false,
    },
  });

  const onSaveAuth = async (data: AuthenticationValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'authentication', ...data }),
      });
      toast.success(t('authSaved'));
    } catch (error) {
      console.error('Failed to save authentication:', error);
      toast.error(t('authSaveFailed'));
    }
  };

  // ─── Advanced Form ─────────────────────────────────────────────────
  const advancedForm = useForm<SecurityAdvancedValues>({
    resolver: zodResolver(securityAdvancedSchema),
    defaultValues: {
      ipWhitelist: false,
      auditLogs: false,
      dataEncryption: false,
    },
  });

  const onSaveAdvanced = async (data: SecurityAdvancedValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'advanced', ...data }),
      });
      toast.success(t('advancedSaved'));
    } catch (error) {
      console.error('Failed to save advanced security:', error);
      toast.error(t('advancedSaveFailed'));
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Authentication ────────────────────────────────────── */}
      <Form {...authForm}>
        <form
          onSubmit={authForm.handleSubmit(onSaveAuth)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('authentication')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={authForm.control}
              name="sessionTimeout"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('sessionTimeout')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('sessionTimeoutHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5 Minutes">{t('minutes5')}</SelectItem>
                        <SelectItem value="15 Minutes">{t('minutes15')}</SelectItem>
                        <SelectItem value="30 Minutes">{t('minutes30')}</SelectItem>
                        <SelectItem value="1 Hour">{t('hour1')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={authForm.control}
              name="loginAttempts"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('loginAttempts')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('loginAttemptsHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={authForm.control}
              name="passwordLength"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('passwordLength')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('passwordLengthHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6 Characters">
                          {t('chars6')}
                        </SelectItem>
                        <SelectItem value="8 Characters">
                          {t('chars8')}
                        </SelectItem>
                        <SelectItem value="12 Characters">
                          {t('chars12')}
                        </SelectItem>
                        <SelectItem value="16 Characters">
                          {t('chars16')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={authForm.control}
              name="uppercaseLetterNumber"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('uppercaseLetterNumber')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('uppercaseLetterNumberHint')}
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

            <FormField
              control={authForm.control}
              name="specialCharacter"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('specialCharacter')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('specialCharacterHint')}
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

            <FormField
              control={authForm.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('twoFactorAuth')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('twoFactorAuthHint')}
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

      {/* ─── Advanced ──────────────────────────────────────────── */}
      <Form {...advancedForm}>
        <form
          onSubmit={advancedForm.handleSubmit(onSaveAdvanced)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('advanced')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={advancedForm.control}
              name="ipWhitelist"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('ipWhitelist')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('ipWhitelistHint')}
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

            <FormField
              control={advancedForm.control}
              name="auditLogs"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('auditLogs')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('auditLogsHint')}
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

            <FormField
              control={advancedForm.control}
              name="dataEncryption"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('dataEncryption')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('dataEncryptionHint')}
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
    </div>
  );
}
