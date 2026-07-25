import { Shield } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';

import { AdminDetail } from '../../models';
import { ADMIN_PERMISSIONS } from '../data/permissions';
import { statusStyles } from '@/shared/utils/helpers';

interface AdminDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminDetail | null;
}

export default function AdminDetailsModal({
  open,
  onOpenChange,
  admin,
}: AdminDetailsModalProps) {
  if (!admin) return null;

  const permissionCategories = admin.adminPermissions || ADMIN_PERMISSIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Admin Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Admin Header */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={admin.avatar} alt={admin.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {admin.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{admin.name}</span>
                <Badge
                  variant="secondary"
                  className="text-xs font-medium gap-1"
                >
                  <Shield className="h-3 w-3" />
                  {admin.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
            <Badge variant="outline" className={statusStyles[admin.status]}>
              {admin.status}
            </Badge>
          </div>

          {/* Permission Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Permission</h3>
            <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
              {permissionCategories.map((category) => (
                <div key={category.name} className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary">
                    {category.name}
                  </p>
                  <div className="space-y-1.5">
                    {category.permissions.map((perm) => (
                      <div
                        key={perm.feature}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {perm.feature}
                        </span>
                        <Checkbox
                          checked={perm.enabled}
                          className="pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Activity</h3>
            {admin.activityLog && admin.activityLog.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admin.activityLog.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs font-medium">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.date}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
