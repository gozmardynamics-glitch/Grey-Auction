'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './drawer';
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
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setOpen(true);
    }
  }, []);

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
    <Drawer open={open} onOpenChange={setOpen} dismissible={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>

        {showCustomize && (
          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('necessary')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('necessaryDesc')}
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('analytics')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('analyticsDesc')}
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('marketing')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('marketingDesc')}
                </p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>
        )}

        <DrawerFooter>
          {showCustomize ? (
            <Button onClick={handleSavePreferences}>
              {t('savePreferences')}
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Button onClick={handleAcceptAll} className="flex-1">
                  {t('acceptAll')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  className="flex-1"
                >
                  {t('rejectAll')}
                </Button>
              </div>
              <Button
                variant="ghost"
                className={cn('text-muted-foreground')}
                onClick={() => setShowCustomize(true)}
              >
                {t('customize')}
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
