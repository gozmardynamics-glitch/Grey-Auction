import { getFaqCategories } from '@/lib/server/data';
import SearchableFaq from '../_islands/searchable_faq';

export default async function FAQPage() {
  const faqCategories = await getFaqCategories();

  return (
    <div className="min-h-screen bg-background space-y-12">
      <div className="px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-2xl sm:text-4xl font-bold text-foreground">
            Frequently Asked
            <br />
            Question
          </h1>
        </div>

        <SearchableFaq faqCategories={faqCategories} />
      </div>
    </div>
  );
}
