'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Globe, Menu, X } from 'lucide-react';
import { Button, Logo } from '@/shared/components/common';
import Link from 'next/link';
import { useState } from 'react';

export default function SellerHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-card border-b ">
        <section className="mx-auto max-w-[96%] p-2">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + Nav together */}
            <div className="flex items-center gap-10">
              <Logo href="/seller" className="text-2xl text-muted-foreground" />

              <nav className="hidden items-center gap-8 md:flex">
                <Link
                  href="/seller#how-it-works"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  How it Works
                </Link>
                <Link
                  href="/seller#testimonies"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Testimonials
                </Link>
                <Link
                  href="/seller#faq"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQs
                </Link>
              </nav>
            </div>

            {/* Desktop Actions - Right */}
            <div className="hidden items-center gap-4 md:flex">
              <Button variant="ghost" className="flex items-center gap-1 p-2 text-muted-foreground hover:text-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm">EN</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button onClick={() => router.push('/auth/login')}>Login</Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </section>
      </header>

      {/* Full-screen mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-primary md:hidden">
          {/* Menu Header */}
          <div className="mx-auto flex w-full max-w-[96%] items-center justify-between p-4">
            <Logo href="/seller" className="text-2xl text-primary-foreground" />
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Menu Links */}
          <nav className="mx-auto flex w-full max-w-[96%] flex-1 flex-col gap-2 px-4 pt-4">
            <Link
              href="/seller#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-primary-foreground/90 transition-colors hover:text-primary-foreground"
            >
              How it Works
            </Link>
            <Link
              href="/seller#testimonies"
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-primary-foreground/90 transition-colors hover:text-primary-foreground"
            >
              Testimonials
            </Link>
            <Link
              href="/seller#faq"
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-primary-foreground/90 transition-colors hover:text-primary-foreground"
            >
              FAQs
            </Link>

            {/* Language Selector */}
            <div className="mt-4">
              <Button variant="ghost" className="flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm">EN</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </nav>

          {/* Bottom Buttons */}
          <div className="mx-auto flex w-full max-w-[96%] gap-3 p-4 pb-8">
            <Button
              variant="secondary"
              className="flex-1"
              size="lg"
              onClick={() => {
                setMenuOpen(false);
                router.push('/auth/login');
              }}
            >
              Log In
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              size="lg"
              onClick={() => {
                setMenuOpen(false);
                router.push('/auth/login/create');
              }}
            >
              Start Selling
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
