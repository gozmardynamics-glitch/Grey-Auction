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

interface AddFaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    category: string;
    question: string;
    answer: string;
    isActive: boolean;
  }) => void;
  categories?: string[];
}

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

export default function AddFaqDialog({
  open,
  onOpenChange,
  onSubmit,
  categories = ['General', 'Bidding', 'Payments', 'Sellers', 'Shipping'],
}: AddFaqDialogProps) {
  const [category, setCategory] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(false);

  const reset = () => {
    setCategory('');
    setQuestion('');
    setAnswer('');
    setIsActive(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = () => {
    onSubmit({ category, question, answer, isActive });
    handleOpenChange(false);
  };

  const isValid = category.trim() && question.trim() && answer.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add FAQs
          </DialogTitle>
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
            <Label className="text-sm">Activate Question</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Actions */}
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
