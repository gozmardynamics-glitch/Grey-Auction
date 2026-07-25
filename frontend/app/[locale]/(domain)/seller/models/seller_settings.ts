import { CreditCard, Gavel, Lock, Bell, Store, Package } from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';

export const SELLER_SETTINGS_MODULES = [
  { key: 'my-profile', label: 'My Profile', icon: Gavel },
  { key: 'security', label: 'Security', icon: Gavel },
  { key: 'store', label: 'Store', icon: Store },
  { key: 'payments', label: 'Payment', icon: CreditCard },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { key: 'plan-packages', label: 'Plan Packages', icon: Package },
  { key: 'contact-us', label: 'Contact Us', icon: Lock },
] as const;

export type SettingsModuleKey = (typeof SELLER_SETTINGS_MODULES)[number]['key'];
