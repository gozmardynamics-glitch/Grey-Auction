import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Providers } from '../providers';
import { Toaster } from '@/shared/components/common/sonner';
import { CookieConsent } from '@/shared/components/common/cookie_consent';
import { PwaProvider } from '@/shared/components/common/pwa/pwa-provider';
import { CurrencyProvider } from '@/shared/currency';
import ChatbotWrapper from '@/shared/components/ai/chatbot-wrapper';

export const metadata: Metadata = {
  applicationName: 'GreyAuction',
  themeColor: '#1a1a2e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GreyAuction',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const fontSans = {
  variable: '--font-geist-sans',
  style: { fontFamily: "'Geist', 'Geist Fallback', system-ui, -apple-system, sans-serif" },
};

const fontMono = {
  variable: '--font-geist-mono',
  style: { fontFamily: "'Geist Mono', 'Geist Mono Fallback', 'Courier New', monospace" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${fontSans.variable} ${fontMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <CurrencyProvider>
              {children}
              <Toaster richColors position="top-right" />
              <CookieConsent />
              <ChatbotWrapper />
              <PwaProvider />
            </CurrencyProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
