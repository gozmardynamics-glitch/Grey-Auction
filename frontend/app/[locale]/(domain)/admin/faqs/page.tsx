import FaqsTable from './components/faqs_table';
import { FAQ_TAB_FILTERS } from '../models/data';
import FaqActions from '../_islands/faq_actions';
import { getAdminFaqs } from '@/lib/server/data';

export default async function Faqs() {
  const faqs = await getAdminFaqs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">FAQs</h1>
        <div className="flex items-center gap-2">
          <FaqActions />
        </div>
      </div>

      <FaqsTable data={faqs} tabFilters={FAQ_TAB_FILTERS} />
    </div>
  );
}
