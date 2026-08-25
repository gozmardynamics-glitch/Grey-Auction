import { Facebook, Instagram, Linkedin, Mail, MapPin, Twitter } from 'lucide-react';
import Link from 'next/link';
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayStoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M3.61 1.814L13.793 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .61-.92zm1.335-.754l11.29 6.465L13.7 10.06 4.945 1.06zM16.235 8.525L19.59 10.44a1 1 0 0 1 0 1.72l-3.355 1.915L13.35 12l2.885-3.475zM4.945 22.94l8.755-9 2.535 3.035L4.945 22.94z" />
  </svg>
);

const FlutterwaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
  </svg>
);

const PaystackIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

import { Button, Logo, NewsletterForm } from '@/shared/components/common';

export default function Footer() {
  return (
    <footer className="bg-background max-w-[96%] md:max-w-full md:mx-0 mx-auto border-t border-border overflow-hidden">
      <div className="relative py-12">
        <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-6 md:gap-8">
          {/* Logo and Contact Info */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="mb-6">
              <div className="mb-4">
                <Logo className="text-2xl text-muted-foreground" />
              </div>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 shrink-0" />
                  <span className="text-sm">
                    No 5, Ijele Street, Victoria Island, Lagos State
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-sm">info@grayauctions.com</span>
                </div>
              </div>
            </div>

            <NewsletterForm />

            {/* App Store Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <Button variant="outline" size='xl' className="[&_svg:not([class*='size-'])]:size-7 flex items-center gap-2 py-2 rounded-lg px-4 h-auto">
                <AppleIcon className="text-primary" />
                <p className="flex flex-col text-left">
                  Download on
                  <span className="font-bold">App Store</span>
                </p>
              </Button>
              <Button variant="outline" size='xl' className="[&_svg:not([class*='size-'])]:size-7 flex items-center gap-2 py-2 rounded-lg px-6 h-auto">
                <PlayStoreIcon className="text-primary" />
                <p className="flex flex-col text-left">
                  Get it on
                  <span className="font-bold">Play Store</span>
                </p>
              </Button>
            </div>
          </div>

          {/* Link columns - 2x2 grid on mobile, inline on md+ */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about-us" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/about-us" className="text-muted-foreground hover:text-foreground transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/career" className="text-muted-foreground hover:text-foreground transition-colors">
                    Career
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    News & Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Marketplace */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                Marketplace
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auctions" className="text-muted-foreground hover:text-foreground transition-colors">
                    Live Auctions
                  </Link>
                </li>
                <li>
                  <Link href="/auctions" className="text-muted-foreground hover:text-foreground transition-colors">
                    Featured Lots
                  </Link>
                </li>
                <li>
                  <Link href="/auctions" className="text-muted-foreground hover:text-foreground transition-colors">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="/seller" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sell with Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Useful */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Useful</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Delivery Information
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Tips for Winning
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Methods + Social Media */}
        <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center mt-12 pt-8 border-t border-border">
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Follow us</span>
            <div className="flex gap-3">
              <Link href="https://facebook.com/greyauctions" target="_blank" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110" aria-label="GreyAuction on Facebook">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="https://twitter.com/greyauctions" target="_blank" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110" aria-label="GreyAuction on X (Twitter)">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="https://instagram.com/greyauctions" target="_blank" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110" aria-label="GreyAuction on Instagram">
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="https://linkedin.com/company/greyauctions" target="_blank" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110" aria-label="GreyAuction on LinkedIn">
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payments</span>
            <div className="flex items-center gap-3">
              {/* Flutterwave */}
              <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-3 py-1.5">
                <div className="h-4 w-4 rounded bg-orange-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">F</span>
                </div>
                <span className="text-xs font-semibold text-foreground">Flutterwave</span>
              </div>
              {/* Paystack */}
              <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-3 py-1.5">
                <div className="h-4 w-4 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">P</span>
                </div>
                <span className="text-xs font-semibold text-foreground">Paystack</span>
              </div>
              {/* Visa */}
              <div className="flex items-center rounded-md border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <span className="text-xs font-bold text-blue-700">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="flex items-center rounded-md border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <div className="flex -space-x-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-80" />
                </div>
              </div>
              {/* Bank Transfer */}
              <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <div className="h-4 w-4 rounded bg-green-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">B</span>
                </div>
                <span className="text-xs font-semibold text-foreground">Bank</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Grey Auctions. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Exchange rates updated daily</span>
              <span className="text-border">|</span>
              <span>NGN &middot; USD &middot; GBP</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
