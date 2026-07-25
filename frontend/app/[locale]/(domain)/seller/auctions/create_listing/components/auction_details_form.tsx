'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Input } from '@/shared/components/common/input';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/common';
import { RichTextEditor } from '@/shared/components/common/rich-text-editor';
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

export default function AuctionDetailsForm({
  defaultValues,
  onNext,
}: AuctionDetailsFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState('');

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
                  <FormLabel required>Product Name</FormLabel>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor
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
