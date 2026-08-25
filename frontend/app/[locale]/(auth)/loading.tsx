import { Skeleton } from '@/shared/components/common';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
