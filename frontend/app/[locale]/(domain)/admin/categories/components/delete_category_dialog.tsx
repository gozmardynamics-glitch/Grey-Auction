
import { DeleteDialog } from '@/shared/components/common';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteCategoryDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete Category"
      description="This category contains active listings. Are you sure you want to delete category? You may want to disable the category if you plan to use it again later."
      confirmLabel="Yes, Delete Category"
    />
  );
}
