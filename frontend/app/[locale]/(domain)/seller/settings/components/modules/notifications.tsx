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
  Switch,
} from '@/shared/components/common';
import {
  notificationsSchema,
  type NotificationsValues,
} from '../../../models/schema';

export default function SellerNotificationsSettings() {
  const notificationsForm = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      auction: false,
      paymentPayout: false,
      messages: false,
      systemSecurity: false,
    },
  });

  const onSaveNotifications = () => {
    
    toast.success('Notification preferences saved.');
  };

  return (
    <div className="space-y-8 p-6">
      <Form {...notificationsForm}>
        <form
          onSubmit={notificationsForm.handleSubmit(onSaveNotifications)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Notification Preferences</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={notificationsForm.control}
              name="auction"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Auction
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Get updates about your listings and bidding activity.
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
              control={notificationsForm.control}
              name="paymentPayout"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Payment & Payout
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Stay informed about payments and withdrawals.
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
              control={notificationsForm.control}
              name="messages"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Messages
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Get notified when buyers or support contact you.
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
              control={notificationsForm.control}
              name="systemSecurity"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      System & Security Alerts
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Important alerts related to account security.
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
