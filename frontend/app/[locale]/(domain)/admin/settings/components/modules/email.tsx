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

  const onSaveSmtp = (data: SmtpConfigValues) => {
    console.log('Saving SMTP config:', data);
    toast.success('SMTP configuration saved.');
  };

  // ─── Mailing Form ──────────────────────────────────────────────────
  const mailingForm = useForm<MailingConfigValues>({
    resolver: zodResolver(mailingConfigSchema),
    defaultValues: {
      emailFromName: 'GreyAuto',
      emailFromAddress: 'noreply@gre...',
    },
  });

  const onSaveMailing = (data: MailingConfigValues) => {
    console.log('Saving mailing config:', data);
    toast.success('Mailing settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Configuration ─────────────────────────────────────── */}
      <Form {...smtpForm}>
        <form
          onSubmit={smtpForm.handleSubmit(onSaveSmtp)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={smtpForm.control}
              name="smtpHost"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      SMTP Host
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the SMTP host of your email service.
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
                      SMTP Port
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the email port from.
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
                      SMTP Encryption
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the encryption of your email.
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
                        <SelectItem value="None">None</SelectItem>
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
                      SMTP Username
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the email of your website.
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
                      SMTP Password
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the password of your website email.
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

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Mailing ───────────────────────────────────────────── */}
      <Form {...mailingForm}>
        <form
          onSubmit={mailingForm.handleSubmit(onSaveMailing)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Mailing</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={mailingForm.control}
              name="emailFromName"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Email From: Name
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the name on your email.
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
                      Email From: Address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the email address of email.
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

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
