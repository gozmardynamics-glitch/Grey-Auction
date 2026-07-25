'use client';

import { CircleCheck, XCircle } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

interface ActionSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'success' | 'error';
  title: string;
  message: string;
  buttonLabel?: string;
}

const variantConfig = {
  success: {
    icon: CircleCheck,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  error: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

export function ActionSuccessDialog({
  open,
  onOpenChange,
  variant,
  title,
  message,
  buttonLabel = 'Done',
}: ActionSuccessDialogProps) {
  const { icon: Icon, iconBg, iconColor } = variantConfig[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">
            {message}
          </p>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            {buttonLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
