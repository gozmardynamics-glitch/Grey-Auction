'use client';

import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DataTable,
  EmptyState,
} from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';
import { useSession } from 'next-auth/react';

import { useActivityLogColumns } from '../activity_logs_column';
import type { ActivityLog } from '../audit_logs_data';

interface BackendAuditRow {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const titleCase = (value: string) =>
  value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditLogsSettings() {
  const t = useTranslations('admin.settings.auditLogs');
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const activityLogColumns = useActivityLogColumns();
  const [logs, setLogs] = useState<ActivityLog[] | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setLogs([]);
      return;
    }
    let cancelled = false;
    apiFetch<{ data: BackendAuditRow[]; total?: number }>('admin/audit', {
      query: { limit: 100, page: 1 },
    })
      .then((json) => {
        if (cancelled) return;
        const rows = Array.isArray(json.data) ? json.data : [];
        setLogs(
          rows.map((row) => ({
            id: row.id,
            user: row.userId ? row.userId.slice(0, 8) + '…' : '—',
            action: titleCase(row.action ?? ''),
            target:
              row.entityType && row.entityId
                ? `${titleCase(row.entityType)} ${row.entityId.slice(0, 8)}…`
                : row.entityType
                  ? titleCase(row.entityType)
                  : 'N/A',
            timestamp: row.createdAt
              ? new Date(row.createdAt).toLocaleString('en-GB')
              : '—',
            ip: row.ipAddress || '—',
            status: 'Success' as const,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  return (
    <div className="space-y-8 p-6">
      {/* Activity Logs — the real admin/audit feed written by the audit interceptor */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">{t('activityLogs')}</h3>

        {logs === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-10 w-10" />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        ) : (
          <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-5rem)]">
            <DataTable
              columns={activityLogColumns}
              data={logs}
              pagination={false}
              showToolbar={false}
            />
          </div>
        )}
      </section>
    </div>
  );
}
