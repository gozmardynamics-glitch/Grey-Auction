
import {
  Dialog,
  DialogContent,
  ScrollArea,
} from '@/shared/components/common';
import type { TransactionDetail } from '../../models';
import TransactionDetailsContent from './transaction_details_content';

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: TransactionDetail | null;
}

export default function TransactionDetailsModal({
  open,
  onOpenChange,
  payment,
}: TransactionDetailsModalProps) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <TransactionDetailsContent payment={payment} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
