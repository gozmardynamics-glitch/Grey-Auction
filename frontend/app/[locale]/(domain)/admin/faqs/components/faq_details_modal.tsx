'use client';

import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  ListOrdered,
  Image,
} from 'lucide-react';

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
import { Faq, type FaqStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

// ---------- Types ----------

export interface FaqDetail extends Faq {
  updatedAt?: string;
  createdBy?: string;
}

interface FaqDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FaqDetail | null;
  onDelete: (faq: FaqDetail) => void;
  onSave: (faq: FaqDetail) => void;
  categories?: string[];
}

// ---------- Helpers ----------

const TOOLBAR_BUTTONS = [
  { icon: Bold, label: 'Bold' },
  { icon: Italic, label: 'Italic' },
  { icon: Underline, label: 'Underline' },
  { icon: Strikethrough, label: 'Strikethrough' },
  { icon: Link, label: 'Link' },
  { icon: ListOrdered, label: 'Ordered List' },
  { icon: List, label: 'Unordered List' },
  { icon: Image, label: 'Image' },
] as const;

// ---------- Main Component ----------

export default function FaqDetailsModal({
  open,
  onOpenChange,
  faq,
  onDelete,
  onSave,
  categories = ['General', 'Bidding', 'Payments', 'Sellers', 'Shipping'],
}: FaqDetailsModalProps) {
  const [category, setCategory] = useState(faq?.category || '');
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [isActive, setIsActive] = useState(faq?.status === 'Active');

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      // Reset to original values
      setCategory(faq?.category || '');
      setQuestion(faq?.question || '');
      setAnswer(faq?.answer || '');
      setIsActive(faq?.status === 'Active');
    }
    onOpenChange(value);
  };

  if (!faq) return null;

  const currentStatus: FaqStatus = isActive ? 'Active' : 'Inactive';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">FAQs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label className="text-sm">Question</Label>
            <Input
              placeholder="Enter question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* Answer with toolbar */}
          <div className="space-y-2">
            <Label className="text-sm">Answer</Label>
            <div className="rounded-lg border">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b px-2 py-1.5">
                {TOOLBAR_BUTTONS.map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded p-1.5 h-auto w-auto text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
              {/* Text area */}
              <textarea
                placeholder="Enter answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Activate Question Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Activate Question</Label>
              <div className="flex items-center gap-2">
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
            <Button variant="destructive" onClick={() => onDelete(faq)}>
              Delete Question
            </Button>
            <Button
              onClick={() =>
                onSave({
                  ...faq,
                  category,
                  question,
                  answer,
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
  );
}
