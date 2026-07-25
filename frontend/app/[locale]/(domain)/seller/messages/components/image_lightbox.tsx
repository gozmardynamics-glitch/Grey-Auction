import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/common';

interface ImageLightboxProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageLightbox({
  imageUrl,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80%] border-none bg-background p-0 shadow-none">
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        <div className="relative w-full min-h-[60vh] max-h-[85vh]">
          <Image
            src={imageUrl}
            alt="Full size preview"
            fill
            className="rounded-lg object-cover"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
