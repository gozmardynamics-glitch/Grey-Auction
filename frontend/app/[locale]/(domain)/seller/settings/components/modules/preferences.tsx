'use client';

import { useTranslations } from 'next-intl';
import { Separator } from '@/shared/components/common';
import { cn } from '@/lib/utils';

const themes: { value: string; labelKey: string; preview: string }[] = [
  { value: 'light', labelKey: 'themeLight', preview: 'bg-white border' },
  { value: 'dark', labelKey: 'themeDark', preview: 'bg-slate-800 border-slate-700' },
  { value: 'system', labelKey: 'themeSystem', preview: 'bg-slate-200 border' },
];

/**
 * There is no per-seller language/appearance endpoint (`PUT /settings/:section`
 * is admin-only), so these are shown as platform defaults rather than as
 * controls that pretend to save.
 */
export default function SellerPreferencesSettings() {
  const t = useTranslations('seller.settings.preferences');

  return (
    <div className="space-y-8 p-6">
      {/* ─── Language ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t('language')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-1">
          <p className="text-sm font-medium">{t('preferredLanguage')}</p>
          <div>
            <p className="text-xs text-muted-foreground">
              {t('preferredLanguageDesc')}
            </p>
            <p className="text-xs text-muted-foreground">
              Language follows the platform default for your region; it is not
              stored on your seller account.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ─── Appearance ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t('appearance')}</h3>
        <p className="text-xs text-muted-foreground">
          Appearance follows your device setting and is not stored on your seller
          account.
        </p>
        <div className="flex gap-4">
          {themes.map((theme) => (
            <div
              key={theme.value}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-transparent p-3"
            >
              <div
                className={cn(
                  'flex h-[100px] w-[160px] flex-col gap-2 rounded-md border p-3',
                  theme.preview
                )}
              >
                <div
                  className={cn(
                    'h-2 w-3/4 rounded',
                    theme.value === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                  )}
                />
                <div
                  className={cn(
                    'h-2 w-1/2 rounded',
                    theme.value === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                  )}
                />
                <div
                  className={cn(
                    'mt-auto h-6 w-full rounded',
                    theme.value === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                  )}
                />
              </div>
              <span className="text-sm font-medium">{t(theme.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
