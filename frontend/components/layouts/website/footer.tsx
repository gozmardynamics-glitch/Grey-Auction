import { Facebook, Instagram, Linkedin, Mail, MapPin } from 'lucide-react';
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
            <div className="flex items-center gap-4 mt-6">
              <Button variant="outline"  size='xl' className="[&_svg:not([class*='size-'])]:size-7 flex items-center gap-2 py-2 rounded-lg px-4 h-auto">
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
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Career
                  </a>
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
                  <Link
                    href="/auctions"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Live Auctions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auctions"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Featured Lots
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auctions"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            {/* Useful */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Useful</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auctions"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Delivery Information
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mt-12 pt-8 border-t border-border">
          {/* Social Media Icons */}
          <div className="flex gap-3">
            <Link href="https://facebook.com" target="_blank">
              <Facebook className="w-7 h-7" />
            </Link>
            <Link href="https://instagram.com" target="_blank">
              <Instagram className="w-7 h-7" />
            </Link>
            <Link href="https://linkedin.com" target="_blank">
              <Linkedin className="w-7.5 h-7.5" />
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              © 2025 Grey Auctions. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
