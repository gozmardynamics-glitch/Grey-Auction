import {
  Cog,
  Mail,
  ShieldCheck,
  CreditCard,
  Gavel,
  Lock,
  FileText,
  Activity,
  Bell,
  Percent,
} from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';

export const SETTINGS_MODULES = [
  { key: 'general', label: 'General', icon: Cog },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'roles-permission', label: 'Roles & Permission', icon: ShieldCheck },
  { key: 'auctions', label: 'Auctions', icon: Gavel },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'fees', label: 'Fees & Charges', icon: Percent },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { key: 'system-status', label: 'System Status', icon: Activity },
] as const;



export type SettingsModuleKey = (typeof SETTINGS_MODULES)[number]['key'];
