'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { Bell, ClipboardList, Home, LayoutDashboard, NotebookPen, Search, Settings, User2, Users } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  SidebarTrigger,
  useSidebar,
} from '@/shared/components/common';

import { LogoutDialog } from '@/shared/components/common/logout-dialog';

const SEGMENT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  auctions: NotebookPen,
  sales: Home,
  messages: ClipboardList,
  payment: Users,
  settings: Settings,
  'bidding-room': Home
};

function formatSegment(segment: string) {
  return segment
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardHeader() {
  const { open } = useSidebar();
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header
      className={`fixed top-0 right-0 z-50 flex h-24.5 shrink-0 items-center gap-4 border-l border-border bg-background px-4 md:px-6 transition-all duration-200 left-0 ${
        open ? 'lg:left-64' : 'lg:left-12'
      }`}
    >
      {/* Sidebar Toggle */}
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-muted-foreground min-w-0">
        {segments.slice(1).map((segment, index) => {
          const href = '/' + segments.slice(0, index + 2).join('/');
          const isLast = index === segments.length - 2;
          const Icon = SEGMENT_ICONS[segment];
          return (
            <span key={href} className="flex items-center gap-2 min-w-0">
              {isLast ? (
                <span className="flex items-center gap-1 min-w-0">
                  {Icon && (
                    <Icon className="h-5 w-5 shrink-0 text-foreground" />
                  )}
                  <p className="text-foreground text-2xl">/</p>
                  <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                    {formatSegment(segment)}
                  </h1>
                </span>
              ) : (
                <Link
                  href={href}
                  className="hidden sm:flex items-center gap-2 text-sm hover:text-foreground transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {formatSegment(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search auctions, products..."
              className="pl-9 h-9 w-full bg-background"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        {/* Notifications Dropdown */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative bg-background"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[calc(100vw-2rem)] sm:w-80 space-y-2"
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="bg-card">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New bid on your auction</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="bg-card">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Auction ending soon</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Profile Dropdown */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="bg-primary/10 rounded-full cursor-pointer"
            >
              <Button variant="ghost" size="icon">
                <User2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/seller/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <LogoutDialog>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  Log out
                </DropdownMenuItem>
              </LogoutDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
