
import { DeleteDialog } from '@/shared/components/common';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete User"
      description="Deleting this user will permanently remove it from the platform. You may want to disable the user if you plan to use it again later."
      confirmLabel="Yes, Delete User"
    />
  );
}
