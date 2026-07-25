import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

interface RemoveParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantName: string;
  onConfirm: () => void;
}

export default function RemoveParticipantDialog({
  open,
  onOpenChange,
  participantName,
  onConfirm,
}: RemoveParticipantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle>Remove Participant</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{' '}
            <span className="font-medium text-foreground">{participantName}</span> from
            this bidding room? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Yes, Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
