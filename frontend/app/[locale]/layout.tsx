import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '../providers';
import { Toaster } from '@/shared/components/common/sonner';
import { CookieConsent } from '@/shared/components/common/cookie_consent';
import ChatbotWrapper from '@/shared/components/ai/chatbot-wrapper';

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
        className={`${fontSans.variable} ${fontMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
            <CookieConsent />
            <ChatbotWrapper />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
