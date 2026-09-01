'use client';

import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { LogoutDialog } from '@/shared/components/common/logout-dialog';
import {
  ChevronUp,
  User2,
  LayoutDashboard,
  LogOut,
  Settings,
  Gavel,
  HandCoins,
  Wallet,
  Users,
  UserRound,
  Image,
  CircleHelp,
  Home,
  ChevronDown,
  File,
  NotepadTextDashed,
  Ticket,
  Cpu,
  ArrowLeftRight,
} from 'lucide-react';

import {
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Gavel, label: 'Auctions', path: '/admin/auctions' },
      { icon: HandCoins, label: 'Bids', path: '/admin/bids' },
      { icon: Home, label: 'Bidding Room', path: '/admin/bidding-room' },
      { icon: Wallet, label: 'Payment', path: '/admin/payment' },
      { icon: ArrowLeftRight, label: 'Exchange Rates', path: '/admin/exchange-rates' },
    ],
  },
  {
    label: 'USER MANAGEMENT',
    items: [
      { icon: Users, label: 'Buyers', path: '/admin/buyers' },
      { icon: UserRound, label: 'Sellers', path: '/admin/sellers' },
    ],
  },
  {
    label: 'CONTENT MANAGEMENT',
    items: [
      { icon: Image, label: 'Banners', path: '/admin/banners' },
      { icon: LayoutDashboard, label: 'Categories', path: '/admin/categories' },
      { icon: CircleHelp, label: 'FAQs', path: '/admin/faqs' },
      {
        icon: File,
        label: 'Terms & Conditions',
        path: '/admin/terms-and-conditions',
      },
      {
        icon: NotepadTextDashed,
        label: 'Privacy Policy',
        path: '/admin/privacy-policy',
      },
    ],
  },
  {
    label: 'AI & AUTOMATION',
    items: [
      { icon: Cpu, label: 'AI Dashboard', path: '/admin/ai' },
      { icon: Cpu, label: 'AI Providers', path: '/admin/ai/providers' },
      { icon: Cpu, label: 'AI Features', path: '/admin/ai/features' },
      { icon: Cpu, label: 'AI Usage', path: '/admin/ai/usage' },
      { icon: Cpu, label: 'Agent Studio', path: '/admin/agents' },
      { icon: Cpu, label: 'Agent Tools', path: '/admin/agents/tools' },
      { icon: Cpu, label: 'Workflows', path: '/admin/agents/workflows' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="bg-background">
      {/* Header */}
      <SidebarHeader className="border-b border-border py-6 bg-card">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent"
            >
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xl font-bold">G</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-primary text-lg">
                    Grey Auctions
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      {/* Navigation Groups */}
      <SidebarContent className="pt-6 bg-background">
        {navGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label ?? groupIndex}>
            {group.label && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground tracking-wider px-5">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className={`px-5 py-6 rounded-xl ${
                          active
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'hover:bg-primary/10'
                        }`}
                      >
                        <Link
                          href={item.path}
                          onClick={() => setOpenMobile(false)}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              active ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {/* Footer - User Menu */}
      <SidebarFooter className="bg-background">
        <Separator />
        {/* System Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground tracking-wider px-5">
            SYSTEM
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {[
                { icon: Users, label: 'Admins', path: '/admin/admins' },
                { icon: Ticket, label: 'Tickets', path: '/admin/tickets' },
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={`px-5 py-6 rounded-xl ${
                        active
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      <Link
                        href={item.path}
                        onClick={() => setOpenMobile(false)}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            active ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator />
        {/* User Menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin User</span>
                    <span className="truncate text-xs text-muted-foreground">
                      admin@grayauctions.com
                    </span>
                  </div>
                  <div>
                    <ChevronUp className="ml-auto size-4" />
                    <ChevronDown className="ml-auto size-4" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/settings"
                    className="cursor-pointer"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <LogoutDialog>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </LogoutDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
