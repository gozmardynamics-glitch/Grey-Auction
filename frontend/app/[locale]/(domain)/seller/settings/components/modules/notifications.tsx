'use client';

import { useTranslations } from 'next-intl';

const CATEGORIES = [
  { key: 'auction', labelKey: 'auction', descriptionKey: 'auctionDesc' },
  { key: 'paymentPayout', labelKey: 'paymentPayout', descriptionKey: 'paymentPayoutDesc' },
  { key: 'messages', labelKey: 'messages', descriptionKey: 'messagesDesc' },
  { key: 'systemSecurity', labelKey: 'systemSecurity', descriptionKey: 'systemSecurityDesc' },
] as const;

/**
 * Notification delivery has no per-seller endpoint: the only settings route
 * (`PUT /settings/:section`) is admin-only, so these categories follow the
 * platform defaults and there is nothing here for a seller to save.
 */
export default function SellerNotificationsSettings() {
  const t = useTranslations('seller.settings.notifications');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          Notifications are sent to every seller using the platform defaults. They
          cannot be changed per account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
        {CATEGORIES.map((category) => (
          <div key={category.key} className="contents">
            <p className="text-sm font-medium">{t(category.labelKey)}</p>
            <div>
              <p className="text-xs text-muted-foreground">
                {t(category.descriptionKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
