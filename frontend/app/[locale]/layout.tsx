import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
// import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';
import { Providers } from '../providers';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/shared/components/common/sonner';
import { CookieConsent } from '@/shared/components/common/cookie_consent';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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

  // CSP nonce (uncomment when CSP is enabled in middleware)
  // const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html lang={locale} suppressHydrationWarning>
      {/* Uncomment when CSP is enabled:
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      */}
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
            <CookieConsent />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
