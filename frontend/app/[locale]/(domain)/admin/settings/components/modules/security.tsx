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
  Switch,
} from '@/shared/components/common';
import {
  authenticationSchema,
  securityAdvancedSchema,
  type AuthenticationValues,
  type SecurityAdvancedValues,
} from '../../../models/schema';

export default function SecuritySettings() {
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

  const onSaveAuth = (data: AuthenticationValues) => {
    console.log('Saving authentication:', data);
    toast.success('Authentication settings saved.');
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

  const onSaveAdvanced = (data: SecurityAdvancedValues) => {
    console.log('Saving security advanced:', data);
    toast.success('Advanced security settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Authentication ────────────────────────────────────── */}
      <Form {...authForm}>
        <form
          onSubmit={authForm.handleSubmit(onSaveAuth)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Authentication</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={authForm.control}
              name="sessionTimeout"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Session Timeout
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify auto logout from all account session.
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
                        <SelectItem value="5 Minutes">5 Minutes</SelectItem>
                        <SelectItem value="15 Minutes">15 Minutes</SelectItem>
                        <SelectItem value="30 Minutes">30 Minutes</SelectItem>
                        <SelectItem value="1 Hour">1 Hour</SelectItem>
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
                      Login Attempts
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify maximum failed login attempts.
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
                      Password Length
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the maximum password length.
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
                          6 Characters
                        </SelectItem>
                        <SelectItem value="8 Characters">
                          8 Characters
                        </SelectItem>
                        <SelectItem value="12 Characters">
                          12 Characters
                        </SelectItem>
                        <SelectItem value="16 Characters">
                          16 Characters
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
                      Uppercase Letter & Number
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Require uppercase and number for password.
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

            <FormField
              control={authForm.control}
              name="specialCharacter"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Special Character
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Require !@#$%^&*()_+= for password.
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

            <FormField
              control={authForm.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      2 Factor Auth
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable 2FA security.
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

      {/* ─── Advanced ──────────────────────────────────────────── */}
      <Form {...advancedForm}>
        <form
          onSubmit={advancedForm.handleSubmit(onSaveAdvanced)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Advanced</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={advancedForm.control}
              name="ipWhitelist"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      IP Whitelist
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Restrict admin access by IP.
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

            <FormField
              control={advancedForm.control}
              name="auditLogs"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Audit Logs
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Track all system activities.
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

            <FormField
              control={advancedForm.control}
              name="dataEncryption"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Data Encryption
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Encrypt sensitive user data.
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
    </div>
  );
}
