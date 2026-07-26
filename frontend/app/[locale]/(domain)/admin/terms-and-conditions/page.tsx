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
import { RichTextEditor } from '@/shared/components/common/rich-text-editor';
import {
  termsAndConditionsSchema,
  type TermsAndConditionsValues,
} from '../models/schema';

export default function TermsAndConditionsPage() {
  const form = useForm<TermsAndConditionsValues>({
    resolver: zodResolver(termsAndConditionsSchema),
    defaultValues: {
      pageTitle: 'Terms & Conditions',
      pageSlug: 'terms-and-condition',
      seoPageTitle: '',
      seoKeyword: '',
      customPageLink: '',
      pageContent: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: TermsAndConditionsValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/content/terms-and-conditions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Terms & Conditions saved.');
    } catch (error) {
      console.error('Failed to save terms & conditions:', error);
      toast.error('Failed to save terms & conditions.');
    }
  };

  return (
    <div className="space-y-8 p-6 bg-background">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="text-base font-semibold">Set Up</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={form.control}
              name="pageTitle"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Page Title
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the title of the page.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={form.control}
              name="pageSlug"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Page Slug
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the URL slug for this page.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={form.control}
              name="seoPageTitle"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      SEO Page Title
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the SEO title for search engines.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={form.control}
              name="seoKeyword"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      SEO Keyword
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify keywords for search engine optimization.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={form.control}
              name="customPageLink"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Custom Page Link
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify a custom link for this page.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Separator />

          <h3 className="text-base font-semibold">Page Content</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={form.control}
              name="pageContent"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Content
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Write the terms and conditions content.
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        className="bg-card"
                        placeholder="Enter terms and conditions content..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Separator />

          <h3 className="text-base font-semibold">Activation</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Active Status
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable or disable this page on the site.
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
                        {field.value ? 'Active' : 'Inactive'}
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
