import { Skeleton } from '@/shared/components/common';

export default function WebsiteLoading() {
  return (
    <div className="px-4 py-6 sm:px-0 space-y-24">
      {/* Banner skeleton */}
      <Skeleton className="h-[400px] w-full rounded-xl" />

      {/* Featured auctions skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-24 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
