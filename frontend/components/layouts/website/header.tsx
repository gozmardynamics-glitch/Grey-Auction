'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { ThemeSwitcher } from './theme-switcher';
import { useLayoutPadding } from '@/hooks/use-layout-padding';

const MobileMenu = dynamic(() => import('./mobile-menu'), { ssr: false });
const FeaturedLots = dynamic(() => import('./featured-lots'), { ssr: false });

import { CATEGORIES_MAP } from '@/shared/data/categories';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
};

/**
 * Scroll-aware header: hides on scroll-down, reveals on scroll-up,
 * with a glass backdrop-blur effect and gold accent on the CTA.
 */
export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { showBreadcrumb } = useLayoutPadding();
  const isSignedIn = useAppSelector((state) => state.auth.isAuthenticated);
  const role = useAppSelector((state) => state.auth.user?.role);

  const [activeCategory, setActiveCategory] = useState('Transport and Logistics');
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 20);
    // Show header when scrolling up or at top; hide when scrolling down
    if (y < 80) {
      setVisible(true);
    } else {
      setVisible(y < lastScrollY.current || y - lastScrollY.current < -5);
    }
    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ease-out
          ${visible ? 'translate-y-0' : '-translate-y-full'}
          ${scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-muted'}
        `}
      >
        {/* Primary bar */}
        <section className={`border-b transition-colors duration-300 ${scrolled ? 'border-border/50' : 'border-border'} p-2`}>
          <div className="mx-auto max-w-[96%] flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6 lg:gap-12">
              <Link href="/" className="flex items-center group">
                <h1 className="text-2xl font-bold tracking-tight group-hover:opacity-80 transition-opacity">
                  <span className="text-foreground">Grey</span>
                  <span className="text-primary ml-1">Auctions</span>
                </h1>
              </Link>

              {/* Desktop Search */}
              <div className="hidden items-center md:flex">
                <form className="flex items-center gap-0">
                  <Select>
                    <SelectTrigger aria-label="Search category" className="h-11 w-auto rounded-l-xl rounded-r-none border border-r-0 border-border bg-card/80 px-4 text-sm shadow-none focus-ring">
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
                      className="h-11 w-72 lg:w-80 rounded-l-none rounded-r-xl border-l-0 border-border bg-card/80 focus-ring"
                      type="search"
                      placeholder="Search for lots..."
                      icon={Search}
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Desktop right actions */}
            <div className="hidden items-center space-x-3 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase text-xs font-medium">{locale}</span>
                    <ChevronDown className="h-3 w-3" />
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

              <ThemeSwitcher />
              <Button
                onClick={() => nextRouter.push('/seller')}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-1 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
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
                className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </section>

        {/* Secondary Navigation */}
        <section className={`hidden md:block border-b transition-colors duration-300 ${scrolled ? 'border-border/30 bg-background/80' : 'border-border bg-background'}`}>
          <div className="mx-auto flex h-14 max-w-[96%] items-center justify-between">
            {/* Quick Links */}
            <nav className="items-center space-x-1 flex">
              <Button
                variant="default"
                size="sm"
                className="rounded-lg font-medium transition-all duration-200"
                onClick={() => router.push('/auctions')}
              >
                All Auctions
              </Button>

              {/* All Categories Mega Menu */}
              <NavigationMenu className="hidden lg:block">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-primary/5 text-primary rounded-lg text-sm font-medium">
                      <TextAlignStart className="mr-2 h-4 w-4" />
                      <span className="hidden md:flex">Categories</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="flex w-[750px] xl:w-[850px]">
                        <div className="w-[180px] shrink-0 overflow-auto flex-col border-r p-4">
                          {Object.keys(CATEGORIES_MAP).map((cat) => (
                            <Link
                              key={cat}
                              href={`/auctions?category=${encodeURIComponent(cat)}`}
                              onMouseEnter={() => setActiveCategory(cat)}
                              className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-150 hover:bg-muted hover:text-primary
                                ${activeCategory === cat ? 'bg-primary/5 font-medium text-primary border-l-2 border-primary' : 'text-muted-foreground'}
                              `}
                            >
                              {cat}
                            </Link>
                          ))}
                        </div>
                        <div className="w-[180px] shrink-0 overflow-auto flex-col border-r p-4">
                          <h3 className="mb-3 text-sm font-semibold text-primary">{activeCategory}</h3>
                          {(CATEGORIES_MAP[activeCategory] || []).map((sub) => (
                            <Link
                              key={sub}
                              href={`/auctions?category=${encodeURIComponent(activeCategory)}&subcategory=${encodeURIComponent(sub)}`}
                              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                        <div className="flex-1 overflow-auto flex-col p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Featured Lots</h3>
                            <Link href="/auctions" className="flex items-center gap-1 text-xs text-primary hover:underline">
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

              <Link href="/auctions?category=Art" className="text-sm text-muted-foreground hidden lg:flex transition-colors hover:text-foreground items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted">
                <PenTool size={15} /> Art
              </Link>
              <Link href="/auctions?category=Construction" className="text-sm text-muted-foreground hidden lg:flex transition-colors hover:text-foreground items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted">
                <Hotel size={15} /> Construction
              </Link>
              <Link href="/auctions?category=Electronics" className="text-sm text-muted-foreground hidden lg:flex transition-colors hover:text-foreground items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted">
                <Plug2 size={15} /> Electronics
              </Link>
              <Link href="/auctions?category=Transport and Logistics" className="text-sm text-muted-foreground hidden lg:flex transition-colors hover:text-foreground items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted">
                <Truck size={15} /> Transport
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="items-center space-x-1 flex">
              <NotificationBell />
              <Button asChild variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Link href="/wishlist">
                  <Heart className="h-4 w-4" />
                  <span className="hidden md:flex text-sm">Wishlist</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden md:flex text-sm">Cart</span>
                </Link>
              </Button>
              <CurrencySelect />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <User className="h-4 w-4" />
                    <span className="hidden md:flex text-sm">Account</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isSignedIn ? (
                    <>
                      <DropdownMenuItem onClick={() => nextRouter.push(`/${role}/dashboard`)}>
                        <User className="mr-2 h-4 w-4" /> My Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <LogoutDialog>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </DropdownMenuItem>
                      </LogoutDialog>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => nextRouter.push('/auth/login')}>
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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