import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const MiniSpinner = ({ className }: { className?: string }) => {
  return <LoaderCircle className={cn('size-5 animate-spin', className)} />;
};

export { MiniSpinner };
