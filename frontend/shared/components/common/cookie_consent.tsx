'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './button';
import { Switch } from './switch';
import { cn } from '@/lib/utils';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getCookieConsent(): CookiePreferences | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1]));
  } catch {
    return null;
  }
}

function setCookieConsent(preferences: CookiePreferences) {
  const value = encodeURIComponent(JSON.stringify(preferences));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const [open, setOpen] = useState(() => getCookieConsent() === null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  function handleAcceptAll() {
    setCookieConsent({ necessary: true, analytics: true, marketing: true });
    setOpen(false);
  }

  function handleRejectAll() {
    setCookieConsent({ necessary: true, analytics: false, marketing: false });
    setOpen(false);
  }

  function handleSavePreferences() {
    setCookieConsent({ necessary: true, analytics, marketing });
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      data-slot="cookie-consent-banner"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm',
        'px-4 py-3 sm:px-6'
      )}
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('description')}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
              {t('acceptAll')}
            </Button>
            <Button variant="outline" onClick={handleRejectAll} className="w-full sm:w-auto">
              {t('rejectAll')}
            </Button>
            <Button
              variant="ghost"
              className={cn('text-muted-foreground w-full sm:w-auto')}
              onClick={() => setShowCustomize(true)}
            >
              {t('customize')}
            </Button>
          </div>
        </div>

        {showCustomize && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t('necessary')}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('necessary')}</p>
                <p className="text-muted-foreground text-xs">{t('necessaryDesc')}</p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('analytics')}</p>
                <p className="text-muted-foreground text-xs">{t('analyticsDesc')}</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('marketing')}</p>
                <p className="text-muted-foreground text-xs">{t('marketingDesc')}</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>

            <Button onClick={handleSavePreferences} className="w-full">
              {t('savePreferences')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}