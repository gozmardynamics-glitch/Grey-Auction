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
} from '@/shared/components/common';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { category: string }) => void;
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddCategoryDialogProps) {
  const [category, setCategory] = useState('');

  const handleOpenChange = (value: boolean) => {
    if (!value) setCategory('');
    onOpenChange(value);
  };

  const handleSubmit = () => {
    onSubmit({ category });
    handleOpenChange(false);
  };

  const isValid = category.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Category
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Input
              placeholder="Enter category name"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!isValid} onClick={handleSubmit}>
              Add Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
