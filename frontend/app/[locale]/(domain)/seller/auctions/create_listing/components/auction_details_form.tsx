'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/shared/components/common/input';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Skeleton,
} from '@/shared/components/common';
import { RichTextEditor } from '@/shared/components/common/rich-text-editor';
import { useAppSelector } from '@/redux/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common/select';
import { CATEGORIES, specFields, SUB_CATEGORIES } from '../../../models';
import {
  auctionDetailsSchema,
  AuctionDetailsValues,
} from '../../../models/schema';
import { useRouter } from 'next/navigation';

interface AuctionDetailsFormProps {
  defaultValues: AuctionDetailsValues;
  onNext: (data: AuctionDetailsValues) => void;
}

// Converts a plain-text AI output into minimal HTML paragraphs so it renders
// correctly inside the shared RichTextEditor (which stores HTML).
const plainTextToHtml = (text: string): string => {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
};

export default function AuctionDetailsForm({
  defaultValues,
  onNext,
}: AuctionDetailsFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState('');

  const authToken = useAppSelector((state) => state.auth.token);
  const [aiGenerating, setAiGenerating] = useState<
    'title' | 'description' | null
  >(null);
  // Bumped whenever AI output is written into the rich-text description so the
  // editor remounts and reflects the programmatic update visually.
  const [descriptionSyncKey, setDescriptionSyncKey] = useState(0);

  // PLACEHOLDER: no LLM key configured yet - the /ai/execute endpoint errors
  // until an LLM provider key is added in Admin > AI; we surface that to the
  // user with a toast and keep manual entry usable.
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const runAIFeature = async (featureKey: string): Promise<string> => {
    const values = form.getValues();
    const res = await fetch(`${apiBase}/ai/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        featureKey,
        input: {
          title: values.productName,
          category: values.category,
          description: values.description,
          subCategory: values.subCategory,
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`AI request failed with status ${res.status}`);
    }
    const json = await res.json();
    if (!json?.success) {
      throw new Error(json?.message || 'AI request failed');
    }
    return (json.data?.output as string) || '';
  };

  const handleOptimizeTitle = async () => {
    if (aiGenerating) return;
    try {
      setAiGenerating('title');
      const output = await runAIFeature('title_optimizer');
      if (output) form.setValue('productName', output.trim());
    } catch {
      toast.error('AI not configured - add an LLM provider key in Admin > AI');
    } finally {
      setAiGenerating(null);
    }
  };

  const handleGenerateDescription = async () => {
    if (aiGenerating) return;
    try {
      setAiGenerating('description');
      const output = await runAIFeature('auction_description_generator');
      if (output) {
        form.setValue('description', plainTextToHtml(output));
        setDescriptionSyncKey((k) => k + 1);
      }
    } catch {
      toast.error('AI not configured - add an LLM provider key in Admin > AI');
    } finally {
      setAiGenerating(null);
    }
  };

  const form = useForm<AuctionDetailsValues>({
    resolver: zodResolver(auctionDetailsSchema),
    defaultValues,
  });

  const tags = useWatch({ control: form.control, name: 'tags' });
  const category = useWatch({ control: form.control, name: 'category' });

  const subCategories = category ? SUB_CATEGORIES[category] || [] : [];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        form.setValue('tags', [...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.setValue(
      'tags',
      tags.filter((t) => t !== tag)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-8">
        {/* Product Name & Description row */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel required>Product Name</FormLabel>
                    {aiGenerating === 'title' ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOptimizeTitle}
                        disabled={aiGenerating !== null}
                        className="h-8 px-3 text-xs"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Optimize title
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Audi Performance"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('subCategory', '');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sub Category */}
            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Sub Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!category}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a sub category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex min-h-[40px] flex-wrap items-center gap-2 rounded-md">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                      >
                        <Button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {tag}
                      </span>
                    ))}
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={
                        tags.length === 0 ? 'Type and press Enter' : ''
                      }
                      className="bg-background"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column - Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Description</FormLabel>
                  {aiGenerating === 'description' ? (
                    <Skeleton className="h-8 w-40" />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={aiGenerating !== null}
                      className="h-8 px-3 text-xs"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Generate description
                    </Button>
                  )}
                </div>
                <FormControl>
                  <RichTextEditor
                    key={descriptionSyncKey}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Describe your product..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Specifications</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specFields.map(({ key, label }) => (
              <FormField
                key={key}
                control={form.control}
                name={`specifications.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder={label}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Continue */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="xl"
            type="button"
            onClick={() => {
              router.back();
            }}
            className="gap-2"
          >
            ← Back
          </Button>
          <Button type="submit" size="xl">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
