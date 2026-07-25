'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from '@/shared/components/common';
import FileDropzone from '@/shared/components/common/file_dropzone';

interface AddBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    file: File | null;
    isActive: boolean;
  }) => void;
}

export default function AddBannerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddBannerDialogProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const reset = () => {
    setTitle('');
    setFile(null);
    setPreview(null);
    setIsActive(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) return;
    if (selectedFile.size > 5 * 1024 * 1024) return; // 5MB limit

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = () => {
    onSubmit({ title, file, isActive });
    handleOpenChange(false);
  };

  const isValid = title.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Banner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm">Title</Label>
            <Input
              placeholder="Enter banner title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Upload Banner */}
          <div className="space-y-2">
            <Label className="text-sm">Upload Banner</Label>
            <FileDropzone
              imagePreview={preview}
              onFilesAccepted={(files) => handleFile(files[0])}
              onFileRemoved={removeFile}
              accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
              maxSize={5 * 1024 * 1024}
              description="JPG, PNG (Max 5MB)"
            />
          </div>

          {/* Activate Banner Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Activate Banner</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!isValid} onClick={handleSubmit}>
              Add Banner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
