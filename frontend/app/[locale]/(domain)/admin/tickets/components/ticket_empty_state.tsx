'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TicketEmptyState() {
  const t = useTranslations('admin.tickets.empty');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{t('title')}</h3>
      <p className="max-w-[320px] text-sm text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}
