import { DeleteDialog } from '@/shared/components/common';

interface DeleteFaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteFaqDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteFaqDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete Question"
      description="Deleting this question will permanently remove it from this platform. You may want to disable the question if you plan to use it again later."
      confirmLabel="Yes, Delete Question"
    />
  );
}
