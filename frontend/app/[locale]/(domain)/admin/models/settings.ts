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
  KeyRound,
  HeartHandshake,
} from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';

/**
 * Nav labels are translation KEYS into the `admin.nav` namespace — the
 * settings sidebar resolves them with next-intl so they follow the locale.
 */
export const SETTINGS_MODULES = [
  { key: 'general', label: 'general', icon: Cog },
  { key: 'email', label: 'email', icon: Mail },
  { key: 'roles-permission', label: 'rolesPermission', icon: ShieldCheck },
  { key: 'auctions', label: 'auctions', icon: Gavel },
  { key: 'payments', label: 'payments', icon: CreditCard },
  { key: 'fees', label: 'fees', icon: Percent },
  { key: 'notifications', label: 'notifications', icon: Bell },
  { key: 'preferences', label: 'preferences', icon: SlidersHorizontal },
  { key: 'security', label: 'security', icon: Lock },
  // Enforced second factor, kept apart from the general security switches
  // because it is a live control and not a preference.
  { key: 'two-factor', label: 'twoFactor', icon: KeyRound },
  // The remedy a complaint handler reaches for, with its own ceiling.
  { key: 'goodwill', label: 'goodwill', icon: HeartHandshake },
  { key: 'audit-logs', label: 'auditLogs', icon: FileText },
  { key: 'system-status', label: 'systemStatus', icon: Activity },
] as const;



export type SettingsModuleKey = (typeof SETTINGS_MODULES)[number]['key'];
