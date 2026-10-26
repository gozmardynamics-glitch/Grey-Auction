'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Clock,
  FileText,
  Funnel,
  Gavel,
  Mail,
  MessageSquare,
  Sparkles,
  TrendingDown,
  Trophy,
  XCircle,
} from 'lucide-react';

import {
  Button,
  EmptyState,
  Skeleton,
  TablePagination,
} from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { apiFetch } from '@/shared/utils/api-client';

const PAGE_SIZE = 5;
/** The API pages server-side; one page is plenty for this list. */
const FETCH_LIMIT = 50;

/** Wire shape of GET /notifications (backend/src/notification). */
interface BackendNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: React.ElementType;
  className: string;
}

/** Backend notification types → the icons this list already used. */
const TYPE_VISUALS: Record<
  string,
  { icon: React.ElementType; className: string }
> = {
  bid_outbid: { icon: TrendingDown, className: 'bg-red-100 text-red-600' },
  auction_won: { icon: Trophy, className: 'bg-yellow-100 text-yellow-600' },
  auction_ended: { icon: Gavel, className: 'bg-blue-100 text-blue-600' },
  invite_approved: { icon: Mail, className: 'bg-blue-100 text-blue-600' },
  room_started: { icon: Sparkles, className: 'bg-tertiary/10 text-green-600' },
  sale_approval_requested: {
    icon: FileText,
    className: 'bg-orange-100 text-orange-600',
  },
  sale_declined: { icon: XCircle, className: 'bg-red-100 text-red-600' },
  new_message: { icon: MessageSquare, className: 'bg-blue-100 text-blue-600' },
  system: { icon: Clock, className: 'bg-orange-100 text-orange-600' },
};

const FALLBACK_VISUAL = { icon: Bell, className: 'bg-muted text-muted-foreground' };

function toNotificationItem(row: BackendNotification): NotificationItem {
  const visual = TYPE_VISUALS[row.type] ?? FALLBACK_VISUAL;
  return {
    id: row.id,
    title: row.title,
    description: row.body ?? '',
    date: row.createdAt
      ? new Date(row.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
    icon: visual.icon,
    className: visual.className,
  };
}

export default function NotificationsList() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [page, setPage] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(
    null
  );

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const json = await apiFetch<{ data: BackendNotification[] }>(
          'notifications',
          { query: { limit: FETCH_LIMIT } }
        );
        if (cancelled) return;
        setNotifications((json.data ?? []).map(toNotificationItem));
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const items = notifications ?? [];
  const isLoading = notifications === null && status !== 'unauthenticated';
  const totalItems = items.length;
  const pageCount = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startItem = totalItems === 0 ? 0 : page * PAGE_SIZE + 1;
  const endItem = Math.min((page + 1) * PAGE_SIZE, totalItems);

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold">Notifications</h2>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">All Activity</h3>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-card">
          <Funnel className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 border-b p-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : totalItems === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="No Notifications"
          description="You're all caught up. New notifications will appear here."
        />
      ) : (
        <>
          {/* Notification Items */}
          <div className="space-y-1">
            {paginatedItems.map((notification) => {
              const Icon = notification.icon;

              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      notification.className
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={page + 1}
            totalPages={pageCount}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={(p) => setPage(p - 1)}
          />
        </>
      )}
    </div>
  );
}
