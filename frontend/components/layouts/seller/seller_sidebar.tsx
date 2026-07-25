'use client';

import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { LogoutDialog } from '@/shared/components/common/logout-dialog';
import { ClipboardList, Home, LayoutDashboard, LogOut, NotebookPen, Settings, ShoppingBag, Users } from 'lucide-react';

import {
  Logo,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/common';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
  { icon: NotebookPen, label: 'Auctions', path: '/seller/auctions' },
  { icon: ShoppingBag, label: 'Sales', path: '/seller/sales' },
  { icon: ClipboardList, label: 'Messages', path: '/seller/messages' },
  { icon: Users, label: 'Payment', path: '/seller/payment' },
  { icon: Home, label: 'Bidding Room', path: '/seller/bidding-room' },
];

export default function SellerSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="bg-background">
      {/* Header */}
      <SidebarHeader className="border-b border-background py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent"
            >
              <div>
                {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xl font-bold">G</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-primary text-lg">
                    Grey Auctions
                  </span>
                </div> */}

                <Logo />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      {/* Main Navigation */}
      <SidebarContent className="pt-12 bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
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
      </SidebarContent>

      {/* Footer - User Menu */}
      <SidebarFooter className="bg-background  group-data-[collapsible=icon]:p-0">
        {/* System Section */}
        <SidebarGroup className="border rounded-2xl group-data-[collapsible=icon]:border-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Credits"
                  className="px-5 py-6 rounded-xl bg-card cursor-pointer"
                >
                  <svg
                    viewBox="0 0 36 36"
                    className="h-10 w-10 shrink-0 bg-background rounded-full p-1 border group-data-[collapsible=icon]:h-5  group-data-[collapsible=+icon]:w-7"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      className="stroke-muted-foreground/20"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(14 / 25) * 97.4} 97.4`}
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                  <span className="flex flex-col truncate">
                    <span className="font-black text-md">Free Trial</span>
                    <span className="font-medium text-sm">
                      14/25 <span className="font-light">Credits</span>
                    </span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  className={`sm:px-5 py-6 rounded-xl ${
                    isActive('/seller/settings')
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'hover:bg-primary/10'
                  }`}
                >
                  <Link
                    href="/seller/settings"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Settings
                      className={`h-6 w-6 ${
                        isActive('/seller/settings')
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <LogoutDialog>
                  <SidebarMenuButton
                    tooltip="Log out"
                    className="px-5 py-6 rounded-xl hover:bg-primary/10 cursor-pointer"
                  >
                    <LogOut className="h-6 w-6 text-muted-foreground" />
                    <span className="font-medium">Log out</span>
                  </SidebarMenuButton>
                </LogoutDialog>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
