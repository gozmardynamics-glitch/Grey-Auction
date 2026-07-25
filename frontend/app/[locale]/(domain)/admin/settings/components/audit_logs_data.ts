export type AlertSeverity = 'High' | 'Medium' | 'Low';
export type AlertAction = 'Blocked' | 'Review' | 'Resolved';
export type LogStatus = 'Success' | 'Failed';

export interface SecurityAlert {
  id: string;
  message: string;
  timeAgo: string;
  severity: AlertSeverity;
  action: AlertAction;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  status: LogStatus;
}

export const DUMMY_ALERTS: SecurityAlert[] = [
  {
    id: 'alert-1',
    message: '3 failed login attempts from IP 203.45.67.89',
    timeAgo: '2 hours ago',
    severity: 'High',
    action: 'Blocked',
  },
  {
    id: 'alert-2',
    message: 'SSL certificate will expire in 30 days',
    timeAgo: '2 hours ago',
    severity: 'Medium',
    action: 'Review',
  },
];

export const DUMMY_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user: 'admin@greyauto.com',
    action: 'User Created',
    target: 'timilehinadekunle@gmail.com',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Success',
  },
  {
    id: 'log-2',
    user: 'timilehinadekunle@gmail.com',
    action: 'Login Attempt',
    target: 'N/A',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Failed',
  },
  {
    id: 'log-3',
    user: 'admin@greyauto.com',
    action: 'Settings',
    target: 'Payment Gateway',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Success',
  },
  {
    id: 'log-4',
    user: 'timilehinadekunle@gmail.com',
    action: 'Login Attempt',
    target: 'N/A',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Success',
  },
  {
    id: 'log-5',
    user: 'admin@greyauto.com',
    action: 'User Created',
    target: 'timilehinadekunle@gmail.com',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Success',
  },
  {
    id: 'log-6',
    user: 'timilehinadekunle@gmail.com',
    action: 'Login Attempt',
    target: 'N/A',
    timestamp: '10-01-2026 • 11:23 AM',
    ip: '192.168.1.100',
    status: 'Failed',
  },
];

