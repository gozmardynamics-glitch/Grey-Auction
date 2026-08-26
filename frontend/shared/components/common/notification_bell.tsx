'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from './button';
import { useAppSelector } from '@/redux/store';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Notification bell: live unread count from /notifications, dropdown with
 * recent items, mark-read on click. Gracefully hides when the API is
 * unavailable or no unread items exist. Responsive: opens as a panel
 * (max-h with scroll) that fits small viewports.
 */
export function NotificationBell() {
  const token = useAppSelector((state) => state.auth.token);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(API_BASE + '/notifications?limit=5', {
          headers: { Authorization: 'Bearer ' + token },
          cache: 'no-store',
        }),
        fetch(API_BASE + '/notifications/unread-count', {
          headers: { Authorization: 'Bearer ' + token },
          cache: 'no-store',
        }),
      ]);
      const list = await listRes.json().catch(() => ({}));
      const count = await countRes.json().catch(() => ({}));
      setItems(Array.isArray(list.data) ? list.data : []);
      setUnread(Number(count.data?.count || 0));
    } catch {
      // API unavailable - keep the bell hidden (no crashing)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    const t = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(t);
  }, [token]);

  const markRead = async (id: string) => {
    try {
      await fetch(API_BASE + '/notifications/' + id + '/read', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token },
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  // Hide entirely for anonymous users
  if (!token) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={'Notifications' + (unread > 0 ? ' - ' + unread + ' unread' : '')}
        className="min-h-11 min-w-11 rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={async () => {
                  try {
                    await fetch(API_BASE + '/notifications/read-all', {
                      method: 'POST',
                      headers: { Authorization: 'Bearer ' + token },
                    });
                    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    setUnread(0);
                  } catch {
                    // ignore
                  }
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                onClick={() => markRead(n.id)}
              >
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
                </span>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;