'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/shared/components/common';
import FileDropzone from '@/shared/components/common/file_dropzone';
import { Banner, type BannerStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

// ---------- Types ----------

export interface BannerDetail extends Banner {
  description?: string;
  targetAudience?: string;
  clicks?: number;
  impressions?: number;
}

interface BannerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: BannerDetail | null;
  onDelete: (banner: BannerDetail) => void;
  onSave: (banner: BannerDetail) => void;
}

// ---------- Helpers ----------

// ---------- Main Component ----------

export default function BannerDetailsModal({
  open,
  onOpenChange,
  banner,
  onDelete,
  onSave,
}: BannerDetailsModalProps) {
  const [category, setCategory] = useState('category-1');
  const [isActive, setIsActive] = useState(banner?.status === 'Active');
  const [preview, setPreview] = useState<string | null>(null);

  // Sync state when banner changes
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setPreview(null);
    }
    onOpenChange(value);
  };

  if (!banner) return null;

  const currentImage = preview || banner.image;
  const currentStatus: BannerStatus = isActive ? 'Active' : 'Inactive';

  const handleFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) return;
    if (selectedFile.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const removeImage = () => {
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Banner Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Banner Image Preview / Upload */}
          <div className="space-y-2">
            <FileDropzone
              imagePreview={currentImage}
              onFilesAccepted={(files) => handleFile(files[0])}
              onFileRemoved={removeImage}
              accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
              maxSize={5 * 1024 * 1024}
              description="JPG, PNG (Max 5MB)"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm">Type</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category-1">Category 1</SelectItem>
                <SelectItem value="category-2">Category 2</SelectItem>
                <SelectItem value="category-3">Category 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activate Banner Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Activate Banner</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className={statusStyles[currentStatus]}
                >
                  {currentStatus}
                </Badge>
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={() => onDelete(banner)}
            >
              Delete Banner
            </Button>
            <Button
              onClick={() => onSave({ ...banner, status: currentStatus })}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
