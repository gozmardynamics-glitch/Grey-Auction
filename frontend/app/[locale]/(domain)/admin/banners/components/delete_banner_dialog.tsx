import { DeleteDialog } from '@/shared/components/common';

interface DeleteBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteBannerDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteBannerDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete Banner"
      description="Deleting this banner will permanently remove it from the platform. You may want to disable the banner if you plan to use it again later."
      confirmLabel="Yes, Delete Banner"
    />
  );
}
