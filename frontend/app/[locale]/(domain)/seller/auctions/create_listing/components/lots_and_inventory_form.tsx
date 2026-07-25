'use client';

import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText } from 'lucide-react';
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
import FileDropzone from '@/shared/components/common/file_dropzone';
import {
  lotAndInventorySchema,
  LotAndInventoryValues,
} from '../../../models/schema';

// Store File objects outside component for form submission
export const imageFilesRef: { current: File[] } = { current: [] };
export const documentFilesRef: { current: File[] } = { current: [] };

interface LotAndInventoryFormProps {
  defaultValues: LotAndInventoryValues;
  onNext: (data: LotAndInventoryValues) => void;
  onBack: () => void;
}

export default function LotAndInventoryForm({
  defaultValues,
  onNext,
  onBack,
}: LotAndInventoryFormProps) {
  const form = useForm<LotAndInventoryValues>({
    resolver: zodResolver(lotAndInventorySchema),
    defaultValues,
  });

  const imagePreviews = useWatch({
    control: form.control,
    name: 'imagePreviews',
  });
  const documentPreviews = useWatch({
    control: form.control,
    name: 'documentPreviews',
  });

  const processImageFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) =>
        (file.type === 'image/jpeg' || file.type === 'image/png') &&
        file.size <= 5 * 1024 * 1024
    );

    const newPreviews = [...imagePreviews];
    validFiles.forEach((file) => {
      const preview = URL.createObjectURL(file);
      imageFilesRef.current.push(file);
      newPreviews.push(preview);
    });
    form.setValue('imagePreviews', newPreviews);
  };

  const processDocumentFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024
    );

    const newPreviews = [...documentPreviews];
    validFiles.forEach((file) => {
      documentFilesRef.current.push(file);
      newPreviews.push(file.name);
    });
    form.setValue('documentPreviews', newPreviews);
  };

  const handleRemoveImage = (index: number) => {
    const preview = imagePreviews[index];
    if (preview) URL.revokeObjectURL(preview);
    imageFilesRef.current.splice(index, 1);
    form.setValue(
      'imagePreviews',
      imagePreviews.filter((_, i) => i !== index)
    );
  };

  const handleRemoveDocument = (index: number) => {
    documentFilesRef.current.splice(index, 1);
    form.setValue(
      'documentPreviews',
      documentPreviews.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column - Lot & Inventory */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="lot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Lot</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter lot number"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inventory"
              render={() => (
                <FormItem>
                  <FormLabel>Inventory</FormLabel>
                  <FormControl>
                    <Input
                      value="Auto-set to 1"
                      disabled
                      className="text-muted-foreground bg-background disabled:border-background"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Document (Optional)</FormLabel>
              <FileDropzone
                onFilesAccepted={(files) => processDocumentFiles(files)}
                accept={{
                  'application/pdf': ['.pdf'],
                }}
                maxSize={5 * 1024 * 1024}
                maxFiles={10}
                description="PDF up to 5 MB"
              />

              {documentPreviews.length > 0 && (
                <div className="space-y-2">
                  {documentPreviews.map((name, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDocument(index)}
                        className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Product Images */}
          <div className="space-y-4">
            <FormLabel>Product Images</FormLabel>

            <FileDropzone
              onFilesAccepted={(files) => processImageFiles(files)}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
              }}
              maxSize={5 * 1024 * 1024}
              maxFiles={10}
              description="JPEG, PNG up to 5 MB"
            />

            {/* Image previews grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    <Image
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="xl"
            type="button"
            onClick={onBack}
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
