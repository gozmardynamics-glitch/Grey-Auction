'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Card, CardContent } from '@/shared/components/common/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';
import { Textarea } from '@/shared/components/common/textarea';
import { getErrorMessage } from '@/shared/utils/error_utils';
import { ContactFormValues, contactSchema } from '../models/schema';

/**
 * Triage topics. Kept in step with the complaints taxonomy in
 * docs/complaints/COMPLAINTS-SECTION.md and the categories in the Complaints
 * Policy, because the ticket queue has no category field of its own.
 */
const TOPICS = [
  'Bidding and auctions',
  'Payments and invoices',
  'Escrow, refunds and disputes',
  'Seller payouts',
  'Listing accuracy and condition',
  'Delivery and collection',
  'Account, verification and access',
  'Data protection and privacy',
  'Something else',
];

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
      topic: 'Bidding and auctions',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      // Backend ContactController: subject + message are required; the name is
      // split into one field for the ticket queue.
      // `topic` is accepted by ContactDto and mapped to a complaint category —
      // which decides the service level, so it is not decoration.
      const res = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          // The subject is the only free field the ticket queue shows, so the
          // topic goes in it — otherwise every complaint and every enquiry look
          // identical to whoever triages the queue.
          subject: `${`${data.firstName} ${data.lastName}`.trim() || data.email || 'Website visitor'} — ${data.topic || 'General'}`,
          topic: data.topic,
          message: data.message,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Could not send your message');
      }
      const json = await res.json().catch(() => null);
      const reference = json?.data?.reference;
      // The policy promises a reference, so it is shown here rather than only
      // emailed — one toast, not two.
      toast.success(
        reference
          ? `Thanks — we have your message. Your reference is ${reference}.`
          : 'Thanks — our team will get back to you shortly.',
      );
      form.reset();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Could not send your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-12 mb-12 bg-card border-none">
      <CardContent className="p-4 sm:p-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled={isLoading}
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is this about?</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Choose a topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TOPICS.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    For a problem with a specific purchase, open a dispute from the
                    purchase itself instead — it freezes the funds while we look into it.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How can we help you?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      disabled={isLoading}
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="xl" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Submit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
