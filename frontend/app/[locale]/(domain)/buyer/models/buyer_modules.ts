import { User, Shield, Heart, MessageSquare, Settings, BaggageClaim, Wallet, LayoutDashboard, Mail, Scale, Truck } from 'lucide-react';

export const BUYER_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'my-bids', label: 'My Bids', icon: User },
  { key: 'invitations', label: 'Invitations', icon: Mail },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'chats', label: 'Chats', icon: Shield },
  { key: 'purchases', label: 'Purchases', icon: BaggageClaim },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'disputes', label: 'Disputes', icon: Scale },
  { key: 'notifications', label: 'Notifications', icon: MessageSquare },
  { key: 'settings', label: 'Settings', icon: Settings }
] as const;

export type BuyerModuleKey = (typeof BUYER_MODULES)[number]['key'];
