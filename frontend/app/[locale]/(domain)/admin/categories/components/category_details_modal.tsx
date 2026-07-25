'use client';

import { useState } from 'react';

import {
  Badge,
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
import { CategoryDetail, type CategoryStatus } from '../../models';
import { DUMMY_CATEGORIES } from '../../models/data';
import { ChevronRight } from 'lucide-react';
import AddSpecificationsDialog from './add_specifications_dialog';
import { statusStyles } from '@/shared/utils/helpers';

interface CategoryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDetail | null;
  onDelete: (category: CategoryDetail) => void;
  onSave: (category: CategoryDetail) => void;
}

export default function CategoryDetailsModal({
  open,
  onOpenChange,
  category,
  onDelete,
  onSave,
}: CategoryDetailsModalProps) {
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('none');
  const [slug, setSlug] = useState('');
  const [specifications, setSpecifications] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [prevKey, setPrevKey] = useState<string | null>(null);

  const key = category && open ? `${category.id}-${open}` : null;
  if (key !== prevKey) {
    setPrevKey(key);
    if (category && open) {
      setName(category.category);
      setParentCategory(category.parentCategory === '-' ? 'none' : category.parentCategory);
      setSlug(category.slug);
      setSpecifications(category.specifications || []);
      setIsActive(category.status === 'Active');
      setPreview(null);
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setPreview(null);
    }
    onOpenChange(value);
  };

  if (!category) return null;

  const currentImage = preview || category.icon;
  const currentStatus: CategoryStatus = isActive ? 'Active' : 'Inactive';

  const handleFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(selectedFile.type)) return;
    if (selectedFile.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const removeImage = () => {
    setPreview(null);
  };

  // Get unique parent categories for the dropdown
  const parentCategoryOptions = DUMMY_CATEGORIES
    .filter((c) => c.parentCategory === '-' && c.id !== category.id)
    .map((c) => c.category);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Category
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Icon */}
            <div className="space-y-2">
              <Label className="text-sm">Icon</Label>
              <FileDropzone
                imagePreview={currentImage}
                onFilesAccepted={(files) => handleFile(files[0])}
                onFileRemoved={removeImage}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/svg+xml': ['.svg'],
                }}
                maxSize={5 * 1024 * 1024}
                description="JPG, PNG, SVG (Max 5MB)"
                className="h-16 w-16"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm">Name</Label>
              <Input
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
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            {/* Specifications */}
            <button
              type="button"
              onClick={() => setSpecsOpen(true)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <span>Specifications</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Activate Category Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Activate Category</Label>
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
                onClick={() => onDelete(category)}
              >
                Delete Category
              </Button>
              <Button
                onClick={() =>
                  onSave({
                    ...category,
                    category: name,
                    parentCategory: parentCategory === 'none' ? '-' : parentCategory,
                    slug,
                    specifications,
                    status: currentStatus,
                  })
                }
              >
                Save Changes
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
