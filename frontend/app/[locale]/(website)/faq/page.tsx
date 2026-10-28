import { getFaqCategories } from '@/lib/server/data';
import SearchableFaq from '../_islands/searchable_faq';

export default async function FAQPage() {
  const faqCategories = await getFaqCategories();

  // The answers below are rendered inside an accordion, which keeps closed
  // panels out of the HTML — fine for the reader, invisible to a search engine.
  // FAQPage structured data makes the questions and answers machine-readable
  // without changing what the visitor sees.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          // Answers are authored in paragraphs; schema.org wants a single string.
          text: item.answer.replace(/\s*\n\s*/g, ' ').trim(),
        },
      })),
    ),
  };

  return (
    <div className="min-h-screen bg-background space-y-12">
      <script
        type="application/ld+json"
        // Our own content, JSON-serialised: no user input reaches this string.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <div className="px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-2xl sm:text-4xl font-bold text-foreground">
            Frequently Asked
            <br />
            Question
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            How bidding, payment, escrow, collection and selling work — written to
            answer the question before you have to ask it.
          </p>
        </div>

        <SearchableFaq faqCategories={faqCategories} />
      </div>
    </div>
  );
}
