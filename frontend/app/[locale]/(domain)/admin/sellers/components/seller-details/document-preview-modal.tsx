import Image from 'next/image';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

import { UploadedDocument } from '../../../models';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: UploadedDocument | null;
  onApprove?: (doc: UploadedDocument) => void;
  onReject?: (doc: UploadedDocument) => void;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  onApprove,
  onReject,
}: DocumentPreviewModalProps) {
  if (!document) return null;

  const isPending = document.status === 'Pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-semibold truncate">
              {document.fileName}
            </DialogTitle>
            {isPending && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => onApprove?.(document)}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => onReject?.(document)}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 pt-3">
          {document.fileUrl ? (
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              {document.fileUrl.match(/\.(png|jpe?g|gif|webp|svg)$/i) ? (
                <div className="relative w-full min-h-[60vh]">
                  <Image
                    src={document.fileUrl}
                    alt={document.fileName}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={document.fileUrl}
                  title={document.fileName}
                  className="w-full h-[60vh] border-0"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60vh] rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                No preview available
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
