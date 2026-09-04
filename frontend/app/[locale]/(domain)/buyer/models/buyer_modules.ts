import { User, Shield, Heart, MessageSquare, Settings, BaggageClaim, Wallet, LayoutDashboard, Mail, Scale, Truck } from 'lucide-react';

/**
 * Nav labels are translation KEYS into the `buyer.nav` namespace — the
 * sidebar resolves them with next-intl so they follow the active locale.
 */
export const BUYER_MODULES = [
  { key: 'dashboard', label: 'dashboard', icon: LayoutDashboard },
  { key: 'my-bids', label: 'myBids', icon: User },
  { key: 'invitations', label: 'invitations', icon: Mail },
  { key: 'wishlist', label: 'wishlist', icon: Heart },
  { key: 'chats', label: 'chats', icon: Shield },
  { key: 'purchases', label: 'purchases', icon: BaggageClaim },
  { key: 'wallet', label: 'wallet', icon: Wallet },
  { key: 'delivery', label: 'delivery', icon: Truck },
  { key: 'disputes', label: 'disputes', icon: Scale },
  { key: 'notifications', label: 'notifications', icon: MessageSquare },
  { key: 'settings', label: 'settings', icon: Settings }
] as const;

export type BuyerModuleKey = (typeof BUYER_MODULES)[number]['key'];
