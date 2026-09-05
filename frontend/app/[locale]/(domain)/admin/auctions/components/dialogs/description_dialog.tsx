'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

interface DescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  mechanical: string[];
}

export function DescriptionDialog({
  open,
  onOpenChange,
  title,
  description,
  mechanical,
}: DescriptionDialogProps) {
  const t = useTranslations('admin.auctions.dialogs');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <CircleCheck className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <h4 className="text-sm font-semibold mb-2">{t('about')}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">{t('mechanical')}</h4>
            <ul className="list-disc pl-5 space-y-1">
              {mechanical.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
