'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Logo,
} from '@/shared/components/common';
import FileDropzone from '@/shared/components/common/file_dropzone';

import {
  VerificationFormValues,
  verificationSchema,
} from '@/app/[locale]/(auth)/components/schema';

export default function VerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      meansOfId: '',
    },
  });

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        alert('Only JPEG, PNG and PDF files are accepted');
        return;
      }

      setUploadedFile(file);
      form.setValue('file', file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    form.setValue('file', undefined);
  };

  const onSubmit = async (data: VerificationFormValues) => {
    if (!uploadedFile) {
      alert('Please upload a file');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      if (data.meansOfId) {
        formData.append('meansOfId', data.meansOfId);
      }
      formData.append('file', uploadedFile);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      router.push('/auth/seller/register/otp/complete_profile/verify/select_plan');
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full rounded-2xl shadow-xl px-6 md:px-16 py-20 bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          Complete your profile
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          We just need a few more details to get your account set up.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Means of ID */}
          <FormField
            control={form.control}
            name="meansOfId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Means of ID</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="passport">
                      International Passport
                    </SelectItem>
                    <SelectItem value="drivers-license">
                      Driver&apos; s License
                    </SelectItem>
                    <SelectItem value="national-id">
                      National ID Card
                    </SelectItem>
                    <SelectItem value="voters-card">
                      Voter&apos;s Card
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Upload */}
          <FormField
            control={form.control}
            name="file"
            render={() => (
              <FormItem>
                <FormLabel className="text-foreground">Upload File</FormLabel>
                <FormControl>
                  <FileDropzone
                    file={uploadedFile}
                    onFilesAccepted={(files) => handleFileChange(files[0])}
                    onFileRemoved={handleRemoveFile}
                    accept={{
                      'image/jpeg': ['.jpg', '.jpeg'],
                      'image/png': ['.png'],
                      'application/pdf': ['.pdf'],
                    }}
                    maxSize={5 * 1024 * 1024}
                    description="JPEG, PNG and PDF up to 5 MB"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary-2 text-primary-foreground font-semibold text-base"
            disabled={isLoading || !uploadedFile}
          >
            {isLoading ? 'Uploading...' : 'Complete Setup'}
          </Button>
        </form>
      </Form>

    </div>
  );
}
