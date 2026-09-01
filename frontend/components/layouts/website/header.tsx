'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { useRouter as useNextRouter } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { CurrencySelect } from '@/shared/currency';

import {
  Menu,
  Search,
  User,
  ShoppingBag,
  ChevronDown,
  Globe,
  Heart,
  LogIn,
  LogOut,
  TextAlignStart,
  PenTool,
  Plug2,
  Hotel,
  Truck,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputWithIcon,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';
import { NotificationBell } from '@/shared/components/common/notification_bell';

import { setMenuOpen } from '@/redux/slices/ui.slice';
import { LogoutDialog } from '@/shared/components/common/logout-dialog';
import WebsiteBreadcrumb from './website_breadcrumb';
import { useLayoutPadding } from '@/hooks/use-layout-padding';

const MobileMenu = dynamic(() => import('./mobile-menu'), { ssr: false });
const FeaturedLots = dynamic(() => import('./featured-lots'), { ssr: false });

import { CATEGORIES_MAP } from '@/shared/data/categories';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
};

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { showBreadcrumb } = useLayoutPadding();
  const isSignedIn = useAppSelector((state) => state.auth.isAuthenticated);
  const role = useAppSelector((state) => state.auth.user?.role);

  const [activeCategory, setActiveCategory] = useState(
    'Transport and Logistics'
  );

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-muted">
        <section className="border-b border-border p-2">
          <div className="mx-auto max-w-[96%] flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6 lg:gap-12">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-muted-foreground">
                  Grey Auctions
                </h1>
              </div>

              {/* Desktop Actions */}
              <div className="hidden items-center md:flex">
                <form className="flex items-center gap-0 ">
                  <Select>
                    <SelectTrigger className="h-12 w-auto rounded-l-lg rounded-r-none border border-r-0 border-border bg-card px-4 text-sm shadow-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center relative">
                    <InputWithIcon
                      className="h-12 w-80 rounded-l-none border-l-0 border-border"
                      type="search"
                      placeholder="Search for lots"
                      icon={Search}
                    />
                  </div>
                </form>
              </div>
            </div>
            <div className="hidden items-center space-x-4 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-2 text-muted-foreground hover:text-muted-foreground"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="uppercase">{locale}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {routing.locales.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => router.replace(pathname, { locale: loc })}
                      className={locale === loc ? 'font-semibold' : ''}
                    >
                      <span className="mr-2 uppercase">{loc}</span>
                      {LOCALE_LABELS[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => nextRouter.push('/seller')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-primary-foreground transition-colors hover:bg-blue-700"
              >
                Become a Seller
              </Button>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                onClick={() => dispatch(setMenuOpen(true))}
                className="min-h-11 min-w-11 text-muted-foreground hover:text-muted-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </section>

        {/* Secondary Navigation */}
        <section className="hidden md:block border-b border-border bg-background">
          <div className="mx-auto flex h-16 max-w-[96%] items-center justify-between">
            {/* Quick Links */}
            <nav className="items-center space-x-6 text-sm flex">
              <Button
                variant="default"
                className="transition-colors hover:text-muted-foreground"
                onClick={() => router.push('/auctions')}
              >
                All Auctions
              </Button>

              {/* ─── All Categories Mega Menu ─────────────────────── */}
              <NavigationMenu className="hidden lg:block">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-primary/10 text-primary-1">
                      <TextAlignStart className="mr-2 h-4 w-4" />
                      <span className="hidden md:flex">All Categories</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="flex w-[750px] xl:w-[850px]">
                        {/* Column 1: Categories */}
                        <div className="w-[180px] shrink-0 overflow-auto flex-col border-r p-4">
                          {Object.keys(CATEGORIES_MAP).map((cat) => (
                            <Link
                              key={cat}
                              href={`/auctions?category=${encodeURIComponent(cat)}`}
                              onMouseEnter={() => setActiveCategory(cat)}
                              className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-primary ${
                                activeCategory === cat
                                  ? 'bg-muted font-medium text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {cat}
                            </Link>
                          ))}
                        </div>

                        {/* Column 2: Subcategories */}
                        <div className="w-[180px] shrink-0 overflow-auto flex-col border-r p-4">
                          <h3 className="mb-3 text-sm font-semibold text-primary">
                            {activeCategory}
                          </h3>
                          {(CATEGORIES_MAP[activeCategory] || []).map((sub) => (
                            <Link
                              key={sub}
                              href={`/auctions?category=${encodeURIComponent(activeCategory)}&subcategory=${encodeURIComponent(sub)}`}
                              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>

                        {/* Column 3: Featured Lots */}
                        <div className="flex-1 overflow-auto flex-col p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                              Featured Lots
                            </h3>
                            <Link
                              href="/auctions"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              View All
                              <ChevronDown className="h-3 w-3 -rotate-90" />
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                            <FeaturedLots />
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link
                href="/auctions?category=Art"
                className="text-foreground hidden lg:flex transition-colors hover:text-muted-foreground items-center gap-2"
              >
                <PenTool size={16} />
                Art
              </Link>
              <Link
                href="/auctions?category=Construction"
                className="text-foreground hidden lg:flex transition-colors hover:text-muted-foreground items-center gap-2"
              >
                <Hotel size={16} />
                Construction
              </Link>
              <Link
                href="/auctions?category=Electronics"
                className="text-foreground hidden lg:flex transition-colors hover:text-muted-foreground items-center gap-2"
              >
                <Plug2 size={16} />
                Electronics
              </Link>
              <Link
                href="/auctions?category=Transport and Logistics"
                className="text-foreground hidden lg:flex transition-colors hover:text-muted-foreground items-center gap-2"
              >
                <Truck size={16} />
                Transport & Logistics
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="items-center space-x-4 flex">
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <Button
                  asChild
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Link href="/wishlist">
                    <Heart className="h-4 w-4" />
                    <span className="hidden md:flex">Wishlist</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Link href="/cart">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden md:flex">Cart</span>
                  </Link>
                </Button>
                <CurrencySelect />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden md:flex">My Account</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isSignedIn ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => nextRouter.push(`/${role}/dashboard`)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          My Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <LogoutDialog>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </DropdownMenuItem>
                        </LogoutDialog>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => nextRouter.push('/auth/login')}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </section>

        {showBreadcrumb && (
          <Suspense fallback={<div className="h-10 border-none" />}>
            <WebsiteBreadcrumb />
          </Suspense>
        )}
      </header>
      <MobileMenu />
    </>
  );
}
