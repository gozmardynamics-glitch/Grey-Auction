'use client';

import { useDropzone, type Accept, type FileRejection } from 'react-dropzone';
import type { ReactNode } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';

export type FileDropzoneProps = {
  onFilesAccepted: (files: File[]) => void;
  onFileRemoved?: () => void;
  onDropRejected?: (fileRejections: FileRejection[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  description?: string;
  file?: File | null;
  imagePreview?: string | null;
  className?: string;
  children?: (isDragActive: boolean) => ReactNode;
};

export default function FileDropzone({
  onFilesAccepted,
  onFileRemoved,
  onDropRejected,
  accept,
  maxFiles,
  maxSize,
  disabled,
  description,
  file,
  imagePreview,
  className = '',
  children,
}: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: onFilesAccepted,
    onDropRejected,
    accept,
    maxFiles,
    maxSize,
    disabled,
  });

  // Image preview mode
  if (imagePreview) {
    return (
      <div
        className={`relative bg-background rounded-lg border overflow-hidden ${className}`}
      >
        <Image
          src={imagePreview}
          alt="Preview"
          width={400}
          height={192}
          className="h-48 w-full object-cover"
        />
        {onFileRemoved && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onFileRemoved}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1 h-auto w-auto text-primary-foreground hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Document preview mode
  if (file) {
    return (
      <div
        className={`border-2 border-border rounded-xl p-4 flex items-center justify-between bg-background ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        {onFileRemoved && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onFileRemoved}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    );
  }

  // Empty drop zone (default)
  return (
    <div
      {...getRootProps()}
      className={[
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      <input {...getInputProps()} />
      {children ? (
        children(isDragActive)
      ) : (
        <>
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Drag & Drop a file here or{' '}
              <span className="font-medium text-primary">Browse</span>
            </p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground/60">
                {description}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
