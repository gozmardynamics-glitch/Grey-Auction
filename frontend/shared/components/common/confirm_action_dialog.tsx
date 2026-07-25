'use client';

import { useState } from 'react';
import { CircleCheck, AlertTriangle } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@/shared/components/common';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  consequenceLabel: string;
  consequences: string[];
  confirmLabel: string;
};

type ApproveVariant = BaseProps & {
  variant: 'approve';
  checkboxLabel: string;
  onConfirm: () => void;
};

type RejectVariant = BaseProps & {
  variant: 'reject';
  textareaPlaceholder?: string;
  onConfirm: (reason: string) => void;
};

type ConfirmActionDialogProps = ApproveVariant | RejectVariant;

export function ConfirmActionDialog(props: ConfirmActionDialogProps) {
  const {
    open,
    onOpenChange,
    title,
    consequenceLabel,
    consequences,
    confirmLabel,
    variant,
  } = props;

  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setConfirmed(false);
      setReason('');
    }
    onOpenChange(value);
  };

  const isApprove = variant === 'approve';
  const isDisabled = isApprove ? !confirmed : !reason.trim();

  const handleConfirm = () => {
    if (props.variant === 'approve') {
      props.onConfirm();
    } else {
      props.onConfirm(reason);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                isApprove ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {isApprove ? (
                <CircleCheck className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium mb-2">{consequenceLabel}</p>
            <ul className="list-disc pl-5 space-y-1">
              {consequences.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {isApprove ? (
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(!!value)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground leading-tight">
                {(props as ApproveVariant).checkboxLabel}
              </span>
            </label>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for rejection{' '}
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder={
                  (props as RejectVariant).textareaPlaceholder ??
                  'Please provide a reason...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant={isApprove ? 'default' : 'destructive'}
              disabled={isDisabled}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
