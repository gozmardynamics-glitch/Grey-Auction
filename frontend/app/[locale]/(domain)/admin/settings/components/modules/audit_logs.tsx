import { ScrollText } from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';

import { DUMMY_ACTIVITY_LOGS, DUMMY_ALERTS } from '../audit_logs_data';
import { activityLogColumns } from '../activity_logs_column';
import SecurityAlerts from '../security_alerts';

export default function AuditLogsSettings() {
  const table = useReactTable({
    data: DUMMY_ACTIVITY_LOGS,
    columns: activityLogColumns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            <Table>
              <TableHeader className="bg-background">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={activityLogColumns.length}
                      className="h-24 text-center"
                    >
                      No activity logs.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
