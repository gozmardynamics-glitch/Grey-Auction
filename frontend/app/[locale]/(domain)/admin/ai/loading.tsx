import { Skeleton } from '@/shared/components/common/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
