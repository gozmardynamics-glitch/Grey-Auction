import { Button, Dialog, DialogContent } from '@/shared/components/common';

interface RoomSubmittedDialogProps {
  open: boolean;
  onGoToDashboard: () => void;
}

export default function RoomSubmittedDialog({
  open,
  onGoToDashboard,
}: RoomSubmittedDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm p-0" showCloseButton={false}>
        <div className="flex flex-col items-center p-6 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-10 w-10"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="8"
                y="4"
                width="32"
                height="40"
                rx="4"
                fill="hsl(var(--primary))"
                opacity="0.15"
              />
              <rect
                x="8"
                y="4"
                width="32"
                height="40"
                rx="4"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
              <text
                x="24"
                y="28"
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize="10"
                fontWeight="700"
              >
                BID
              </text>
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Room Submitted for Review
            </h3>
            <p className="text-sm text-muted-foreground">
              We&apos;re reviewing your details. Your room will go live once
              approved.
            </p>
          </div>
          <Button onClick={onGoToDashboard}>Go to Dashboard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
