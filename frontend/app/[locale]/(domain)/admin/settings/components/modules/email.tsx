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
} from '@/shared/components/common';
import {
  smtpConfigSchema,
  mailingConfigSchema,
  type SmtpConfigValues,
  type MailingConfigValues,
} from '../../../models/schema';

export default function EmailSettings() {
  const t = useTranslations('admin.settings.email');
  // ─── SMTP Form ──────────────────────────────────────────────────────
  const smtpForm = useForm<SmtpConfigValues>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      smtpHost: 'smtp.gmail.c...',
      smtpPort: '587',
      smtpEncryption: 'TLS',
      smtpUsername: 'noreply@gre...',
      smtpPassword: '',
    },
  });

  const onSaveSmtp = async (data: SmtpConfigValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'smtp', ...data }),
      });
      toast.success(t('smtpSaved'));
    } catch (error) {
      console.error('Failed to save SMTP config:', error);
      toast.error(t('smtpSaveFailed'));
    }
  };

  // ─── Mailing Form ──────────────────────────────────────────────────
  const mailingForm = useForm<MailingConfigValues>({
    resolver: zodResolver(mailingConfigSchema),
    defaultValues: {
      emailFromName: 'GreyAuto',
      emailFromAddress: 'noreply@gre...',
    },
  });

  const onSaveMailing = async (data: MailingConfigValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'mailing', ...data }),
      });
      toast.success(t('mailingSaved'));
    } catch (error) {
      console.error('Failed to save mailing config:', error);
      toast.error(t('mailingSaveFailed'));
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Configuration ─────────────────────────────────────── */}
      <Form {...smtpForm}>
        <form
          onSubmit={smtpForm.handleSubmit(onSaveSmtp)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('configuration')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={smtpForm.control}
              name="smtpHost"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('smtpHost')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('smtpHostHint')}
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
              control={smtpForm.control}
              name="smtpPort"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('smtpPort')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('smtpPortHint')}
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
              control={smtpForm.control}
              name="smtpEncryption"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('smtpEncryption')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('smtpEncryptionHint')}
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
                        <SelectItem value="TLS">TLS</SelectItem>
                        <SelectItem value="SSL">SSL</SelectItem>
                        <SelectItem value="None">{t('encryptionNone')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={smtpForm.control}
              name="smtpUsername"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('smtpUsername')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('smtpUsernameHint')}
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
              control={smtpForm.control}
              name="smtpPassword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('smtpPassword')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('smtpPasswordHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        
                        type="password"
                        {...field}
                        placeholder="••••••"
                      />
                    </FormControl>
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

      {/* ─── Mailing ───────────────────────────────────────────── */}
      <Form {...mailingForm}>
        <form
          onSubmit={mailingForm.handleSubmit(onSaveMailing)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('mailing')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={mailingForm.control}
              name="emailFromName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('emailFromName')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('emailFromNameHint')}
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
              control={mailingForm.control}
              name="emailFromAddress"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('emailFromAddress')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('emailFromAddressHint')}
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
          </div>

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>
    </div>
  );
}
