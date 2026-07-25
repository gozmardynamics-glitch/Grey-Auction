
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge, EmptyState } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { SecurityAlert } from './audit_logs_data';
import { statusStyles } from '@/shared/utils/helpers';

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
}

export default function SecurityAlerts({ alerts }: SecurityAlertsProps) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-10 w-10" />}
        title="No Security Alerts"
        description="Everything looks good. Security alerts will appear here if any issues are detected."
      />
    );
  }

  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Security Alerts
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-destructive bg-background px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs text-muted-foreground">{alert.timeAgo}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className={cn('font-medium', statusStyles[alert.severity])}
              >
                {alert.severity}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('font-medium', statusStyles[alert.action])}
              >
                {alert.action}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
