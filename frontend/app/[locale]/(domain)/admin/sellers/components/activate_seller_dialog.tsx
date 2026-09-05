'use client';

import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

interface ActivateSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ActivateSellerDialog({
  open,
  onOpenChange,
  onConfirm,
}: ActivateSellerDialogProps) {
  const t = useTranslations('admin.sellers.dialogs.activate');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {t('body')}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={onConfirm}>{t('confirm')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
