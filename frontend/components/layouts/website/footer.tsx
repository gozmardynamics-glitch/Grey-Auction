import { Facebook, Instagram, Linkedin, Mail, MapPin, Twitter, ArrowUpRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

/** Link columns are built inside the component so labels come from the catalog. */
function buildFooterColumns(t: (key: string) => string) {
  return [
    {
      title: t('company'),
      links: [
        { label: t('aboutUs'), href: '/about-us' },
        { label: t('career'), href: '/career' },
        { label: t('blog'), href: '/blog' },
        { label: t('contactUs'), href: '/contact' },
      ],
    },
    {
      title: t('support'),
      links: [
        { label: t('faq'), href: '/faq' },
        { label: t('privacyPolicy'), href: '/privacy-policy' },
        { label: t('termsAndConditions'), href: '/terms' },
        { label: t('deliveryInfo'), href: '/faq' },
      ],
    },
    {
      title: t('auctions'),
      links: [
        { label: t('browseAll'), href: '/auctions' },
        { label: t('directSales'), href: '/direct-sales' },
        { label: t('advisors'), href: '/advisors' },
        { label: t('subscribe'), href: '/subscribe' },
      ],
    },
  ];
}

export default async function Footer() {
  const t = await getTranslations('footer');
  const footerLinks = buildFooterColumns(t);

  return (
    <footer className="bg-[#0e1a2b] text-[#e8edf5] overflow-hidden">
      <div className="relative max-w-[96%] md:max-w-full md:mx-0 mx-auto">
        {/* Main footer content */}
        <div className="px-6 py-10 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Brand column */}
            <div className="lg:col-span-4 space-y-6">
              <Logo className="text-2xl text-primary-foreground" />
              <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-xs">
                {t('tagline')}
              </p>
              <div className="space-y-3 text-sm text-primary-foreground/60">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
                  <span>No 5, Ijele Street, Victoria Island, Lagos State</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-secondary" />
                  <span>info@grayauctions.com</span>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground/70 transition-all duration-200 hover:bg-secondary hover:text-primary hover:scale-110 hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {footerLinks.map((column) => (
              <div key={column.title} className="lg:col-span-2">
                <h3 className="text-sm font-bold text-primary-foreground uppercase tracking-wider mb-5">{column.title}</h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-primary-foreground/60 transition-colors duration-200 hover:text-secondary flex items-center gap-1 group"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter + App */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-sm font-bold text-primary-foreground uppercase tracking-wider mb-5">{t('stayUpdated')}</h3>
              <NewsletterForm />
              <div className="space-y-3 pt-2">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-lg border border-primary-foreground/20 bg-transparent text-[#e8edf5] hover:bg-white/10 hover:text-white">
                  <AppleIcon className="h-5 w-5" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-[#aab6c5]">{t('downloadOn')}</span>
                    <span className="text-xs font-semibold text-white">App Store</span>
                  </div>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-lg border border-primary-foreground/20 bg-transparent text-[#e8edf5] hover:bg-white/10 hover:text-white">
                  <PlayStoreIcon className="h-5 w-5" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-[#aab6c5]">{t('getItOn')}</span>
                    <span className="text-xs font-semibold text-white">Google Play</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 px-6 py-4 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#98a4b3]">
              © {new Date().getFullYear()} Grey Auctions. {t('copyright')}.
            </p>
            <p className="text-xs text-[#98a4b3] flex items-center gap-1">
              {t('madeWith')} <Heart className="h-3 w-3 text-secondary fill-secondary" /> {t('inLagos')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
