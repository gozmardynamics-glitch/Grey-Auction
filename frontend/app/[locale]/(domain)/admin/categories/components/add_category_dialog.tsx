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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/shared/components/common';
import FileDropzone from '@/shared/components/common/file_dropzone';
import { Category } from '../../models';
import { ChevronRight } from 'lucide-react';
import AddSpecificationsDialog from './add_specifications_dialog';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    parentCategory: string;
    slug: string;
    specifications: string[];
    file: File | null;
    isActive: boolean;
  }) => void;
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  categories,
  onSubmit,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('none');
  const [slug, setSlug] = useState('');
  const [specifications, setSpecifications] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);

  const reset = () => {
    setName('');
    setParentCategory('none');
    setSlug('');
    setSpecifications([]);
    setFile(null);
    setPreview(null);
    setIsActive(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/svg+xml',
    ];
    if (!validTypes.includes(selectedFile.type)) return;
    if (selectedFile.size > 5 * 1024 * 1024) return;

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
    onSubmit({ name, parentCategory, slug, specifications, file, isActive });
    handleOpenChange(false);
  };

  const isValid = name.trim();

  // Get unique parent categories for the dropdown
  const parentCategoryOptions = categories
    .filter((c) => c.parentCategory === '-')
    .map((c) => c.category);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add Category
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Icon */}
            <div className="space-y-2">
              <Label className="text-sm">Icon</Label>
              <FileDropzone
                imagePreview={preview}
                onFilesAccepted={(files) => handleFile(files[0])}
                onFileRemoved={removeFile}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/svg+xml': ['.svg'],
                }}
                maxSize={5 * 1024 * 1024}
                description="JPG, PNG, SVG (Max 5MB)"
                className="h-16 w-16 truncate"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm">Name</Label>
              <Input
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label className="text-sm">Parent Category</Label>
              <Select value={parentCategory} onValueChange={setParentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentCategoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slug URL */}
            <div className="space-y-2">
              <Label className="text-sm">Slug URL</Label>
              <Input
                placeholder="Enter slug URL"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            {/* Add Specifications */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSpecsOpen(true)}
              className="flex justify-between w-full h-12"
            >
              <span>Add Specifications</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Activate Category Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Activate Category</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!isValid} onClick={handleSubmit}>
                Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddSpecificationsDialog
        open={specsOpen}
        onOpenChange={setSpecsOpen}
        specifications={specifications}
        onSave={setSpecifications}
      />
    </>
  );
}
