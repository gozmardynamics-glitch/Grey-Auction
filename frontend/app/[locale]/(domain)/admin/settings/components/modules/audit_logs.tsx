import { ScrollText } from 'lucide-react';

import {
  DataTable,
  EmptyState,
} from '@/shared/components/common';

import { DUMMY_ACTIVITY_LOGS, DUMMY_ALERTS } from '../audit_logs_data';
import { activityLogColumns } from '../activity_logs_column';
import SecurityAlerts from '../security_alerts';

export default function AuditLogsSettings() {
  return (
    <div className="space-y-8 p-6">
      {/* Security Alerts */}
      <SecurityAlerts alerts={DUMMY_ALERTS} />

      {/* Activity Logs */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Activity Logs</h3>

        {DUMMY_ACTIVITY_LOGS.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-10 w-10" />}
            title="No Activity Logs"
            description="Activity logs will appear here as actions are performed in the system."
          />
        ) : (
          <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-5rem)]">
            <DataTable
              columns={activityLogColumns}
              data={DUMMY_ACTIVITY_LOGS}
              pagination={false}
              showToolbar={false}
            />
          </div>
        )}
      </section>
    </div>
  );
}