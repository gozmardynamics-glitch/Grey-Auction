import { User, Shield, Heart, MessageSquare, Settings, BaggageClaim, Wallet, LayoutDashboard } from 'lucide-react';

export const BUYER_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'my-bids', label: 'My Bids', icon: User },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'chats', label: 'Chats', icon: Shield },
  { key: 'purchases', label: 'Purchases', icon: BaggageClaim },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'notifications', label: 'Notifications', icon: MessageSquare },
  { key: 'settings', label: 'Settings', icon: Settings }
] as const;

export type BuyerModuleKey = (typeof BUYER_MODULES)[number]['key'];
