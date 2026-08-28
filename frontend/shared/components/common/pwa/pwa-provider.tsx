'use client';

import { useCallback, useEffect, useState } from 'react';

export const SERVICE_WORKER_URL = '/sw.js';
const DISMISS_KEY = 'greyauction:install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function shouldRegisterServiceWorker(): boolean {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  // Keep the SW out of the dev server (HMR + stale caches); enable explicitly with NEXT_PUBLIC_PWA_DEV=1.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PWA_DEV !== '1') return false;
  return true;
}

/**
 * PwaProvider (L1 base):
 *  - registers the service worker in production builds,
 *  - shows a slim banner when the connection drops,
 *  - captures beforeinstallprompt for an in-app "Install" affordance.
 */
export function PwaProvider({ children }: { children?: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return;
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch(() => {
      /* SW is progressive enhancement — never break the app if it fails. */
    });
  }, []);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    setOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const evt = event as BeforeInstallPromptEvent;
      setInstallPrompt(evt);
      try {
        if (!window.localStorage.getItem(DISMISS_KEY)) setInstallVisible(true);
      } catch {
        setInstallVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const onInstall = useCallback(async () => {
    if (!installPrompt) return;
    setInstallVisible(false);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
    } catch {
      /* ignore — browser may reject the prompt */
    }
  }, [installPrompt]);

  const onDismiss = useCallback(() => {
    setInstallVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode */
    }
  }, []);

  return (
    <>
      {children}
      {offline && (
        <div
          role="status"
          data-testid="offline-banner"
          className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950"
        >
          You&rsquo;re offline — showing the last cached pages. Bidding resumes when you reconnect.
        </div>
      )}
      {installVisible && installPrompt && (
        <div
          role="region"
          aria-label="Install GreyAuction"
          data-testid="install-banner"
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-[#1a1a2e] px-4 py-3 text-sm text-white"
        >
          <span className="font-medium">Install the GreyAuction app for faster bidding</span>
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onInstall}
              className="rounded-md bg-[#e94560] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Install
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss install banner"
              className="rounded-md px-2 py-1.5 text-xs text-white/70 hover:text-white"
            >
              Later
            </button>
          </span>
        </div>
      )}
    </>
  );
}

export default PwaProvider;
