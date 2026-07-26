import { Skeleton } from '@/shared/components/common';

export default function BuyerDashboardLoading() {
  return (
    <div className="space-y-6 mt-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid sm:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="col-span-3 rounded-lg border p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
