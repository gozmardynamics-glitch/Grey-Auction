'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { setMenuOpen } from '@/redux/slices/ui.slice';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  Globe,
  ChevronDown,
  Mail,
  Instagram,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/common';
import { Button } from '@/shared/components/common';
import Image from 'next/image';
import Link from 'next/link';
import { dummyAuctions } from '@/app/[locale]/(website)/models/data';

const CATEGORIES_MAP: Record<string, string[]> = {
  Agriculture: ['Tractors', 'Harvesters', 'Seeders', 'Irrigation'],
  'Food Industry': ['Bakery', 'Beverages', 'Packaging', 'Processing'],
  Construction: ['Cranes', 'Excavators', 'Loaders', 'Concrete'],
  'Transport and Logistics': [
    'Cars',
    'Trucks',
    'Trailers',
    'Motorcycles',
    'Army Trucks',
  ],
  'Renewable Energy': ['Solar Panels', 'Wind Turbines', 'Batteries'],
  Events: ['Staging', 'Lighting', 'Sound', 'Furniture'],
  Electronics: ['Phones', 'Laptops', 'Cameras', 'Audio'],
  Fashion: [
    'Jewellery',
    'Women',
    'Men',
    'Towel',
    'Sport Shoes',
    'Watches',
    'Bags',
    'Unisex',
    'Swimwear',
    'Cycling Wear',
  ],
  'Beauty & Health': ['Skincare', 'Haircare', 'Supplements', 'Devices'],
};

type MenuView = 'main' | 'categories' | 'contact';

export default function MobileMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isMenuOpen = useAppSelector((state) => state.ui.isMenuOpen);
  const [view, setView] = useState<MenuView>('main');

  const handleClose = () => {
    dispatch(setMenuOpen(false));
    // Reset to main view after close animation
    setTimeout(() => setView('main'), 300);
  };

  const handleNavigate = (href: string) => {
    handleClose();
    router.push(href);
  };

  const featuredAuction = dummyAuctions[0];

  return (
    <Sheet open={isMenuOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-full sm:max-w-sm p-0 flex flex-col"
      >
        {/* ─── Main View ─────────────────────────────────────── */}
        {view === 'main' && (
          <>
            <SheetHeader className="flex-row items-center justify-between border-b px-5 py-4">
              <SheetTitle className="text-xl font-bold text-muted-foreground">
                Grey Auctions
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={handleClose}
                className="min-h-11 min-w-11 rounded-md text-muted-foreground hover:text-foreground"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto">
              <ul className="divide-y">
                <li>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigate('/auctions')}
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted h-auto rounded-none"
                  >
                    All Auctions
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    onClick={() => setView('categories')}
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted h-auto rounded-none"
                  >
                    Categories
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    onClick={() => setView('contact')}
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted h-auto rounded-none"
                  >
                    Contact Us
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigate('/faqs')}
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted h-auto rounded-none"
                  >
                    FAQs
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              </ul>

              {/* Language selector */}
              <div className="border-t px-5 py-4">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm text-muted-foreground p-0 h-auto"
                >
                  <Globe className="h-5 w-5" />
                  <span className="uppercase">en</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </nav>

            {/* Bottom buttons */}
            <div className="border-t p-5 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => handleNavigate('/auth/login')}
              >
                Log In
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-primary-foreground"
                size="lg"
                onClick={() => handleNavigate('/seller')}
              >
                Become a Seller
              </Button>
            </div>
          </>
        )}

        {/* ─── Categories View ───────────────────────────────── */}
        {view === 'categories' && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b px-5 py-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to main menu"
                onClick={() => setView('main')}
                className="min-h-11 min-w-11 rounded-md text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <SheetTitle className="text-lg font-semibold">
                Categories
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto">
              <ul className="divide-y">
                {Object.keys(CATEGORIES_MAP).map((category) => (
                  <li key={category}>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        handleNavigate(
                          `/auctions?category=${encodeURIComponent(category)}`
                        )
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted h-auto rounded-none"
                    >
                      {category}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>

              {/* Featured auction card */}
              {featuredAuction && (
                <div className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                    Featured Auction
                  </p>
                  <Link
                    href={`/auctions/${featuredAuction.id}`}
                    onClick={handleClose}
                    className="group block overflow-hidden rounded-lg border"
                  >
                    <div className="relative h-36 bg-muted">
                      <Image
                        src={featuredAuction.imageUrl ?? '/placeholder.svg'}
                        alt={featuredAuction.title}
                        width={400}
                        height={200}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-medium">
                        {featuredAuction.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {featuredAuction.location?.city},{' '}
                        {featuredAuction.location?.country}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        ₦{featuredAuction.currentBid.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </nav>
          </>
        )}

        {/* ─── Contact Us View ───────────────────────────────── */}
        {view === 'contact' && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b px-5 py-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to main menu"
                onClick={() => setView('main')}
                className="min-h-11 min-w-11 rounded-md text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <SheetTitle className="text-lg font-semibold">
                Contact Us
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto">
              <ul className="divide-y">
                <li>
                  <a
                    href="mailto:info@greyauctions.com"
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      Email
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/greyauctions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/greyauctions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-muted-foreground" />
                      Instagram
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </li>
              </ul>
            </nav>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
