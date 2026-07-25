'use client';

import { useState } from 'react';
import { Bell, Funnel } from 'lucide-react';

import {
  Button,
  EmptyState,
  TablePagination,
} from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { notifications } from '../../../models/data';
import { typeConfig } from '../../../models';

const PAGE_SIZE = 5;

export default function NotificationsList() {
  const [page, setPage] = useState(0);

  const totalItems = notifications.length;
  const pageCount = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedItems = notifications.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const startItem = page * PAGE_SIZE + 1;
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

      {notifications.length === 0 ? (
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
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      config.className
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
