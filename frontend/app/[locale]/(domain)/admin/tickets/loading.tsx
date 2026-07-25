import { Skeleton } from '@/shared/components/common';

export default function AdminTicketsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex h-[calc(100vh-200px)] gap-4">
        <div className="w-80 space-y-3 border-r pr-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
