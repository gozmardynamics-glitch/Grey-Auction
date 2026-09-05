import { getTranslations } from 'next-intl/server';
import TicketsPanel from '../_islands/tickets_panel';
import { getAdminTickets } from '@/lib/server/data';

export default async function TicketsPage() {
  const tickets = await getAdminTickets();
  const t = await getTranslations('admin.tickets.page');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      <TicketsPanel tickets={tickets} />
    </div>
  );
}
