'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/shared/components/common';

interface AddSpecificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specifications: string[];
  onSave: (specifications: string[]) => void;
}

export default function AddSpecificationsDialog({
  open,
  onOpenChange,
  specifications,
  onSave,
}: AddSpecificationsDialogProps) {
  const [specs, setSpecs] = useState<string[]>(['', '', '']);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open && !prevOpen) {
    setSpecs(specifications.length > 0 ? [...specifications] : ['', '', '']);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const addSpec = () => {
    setSpecs([...specs, '']);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, value: string) => {
    const updated = [...specs];
    updated[index] = value;
    setSpecs(updated);
  };

  const handleSave = () => {
    const filtered = specs.filter((s) => s.trim() !== '');
    onSave(filtered);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Specifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Enter specification"
                value={spec}
                onChange={(e) => updateSpec(index, e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeSpec(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addSpec}>
            <Plus className="h-4 w-4" />
            Add Specification
          </Button>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Specifications</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
