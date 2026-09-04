import { CreditCard, Gavel, Lock, Bell, Store, Package, Percent } from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';

/**
 * Nav labels are translation KEYS into the `seller.nav` namespace — the
 * settings sidebar resolves them with next-intl so they follow the locale.
 */
export const SELLER_SETTINGS_MODULES = [
  { key: 'my-profile', label: 'myProfile', icon: Gavel },
  { key: 'security', label: 'security', icon: Gavel },
  { key: 'store', label: 'store', icon: Store },
  { key: 'payments', label: 'payments', icon: CreditCard },
  { key: 'fees-payouts', label: 'feesPayouts', icon: Percent },
  { key: 'auction-payment', label: 'auctionPayment', icon: Gavel },
  { key: 'notifications', label: 'notifications', icon: Bell },
  { key: 'preferences', label: 'preferences', icon: SlidersHorizontal },
  { key: 'plan-packages', label: 'planPackages', icon: Package },
  { key: 'contact-us', label: 'contactUs', icon: Lock },
] as const;

export type SettingsModuleKey = (typeof SELLER_SETTINGS_MODULES)[number]['key'];
