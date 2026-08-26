import { Card, CardContent } from '@/shared/components/common';

const FALLBACKS: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: 'Terms & Conditions',
    body: [
      'By accessing or using GreyAuction, you agree to these terms. Bidding is binding: when you win an auction you are obligated to complete the purchase at your final bid plus any applicable buyer premium, VAT and charges shown at checkout.',
      'All listings are provided by sellers. GreyAuction facilitates the auction; sellers are responsible for the accuracy of their descriptions and the condition of their items. Always inspect or request a condition report before bidding.',
      'Payments must be completed within the settlement window shown on your invoice. Failure to pay may result in suspension of your bidding privileges.',
      'We may update these terms from time to time. Continued use of the platform constitutes acceptance of the updated terms.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'GreyAuction respects your privacy. We collect the information you provide when creating an account, placing bids, making purchases and communicating with sellers and support.',
      'We use this data to operate the platform, process payments and invoices, prevent fraud, and improve your experience. We do not sell your personal data.',
      'Cookies enable core features such as keeping you signed in and remembering your preferences. You can manage cookie preferences via the consent banner.',
      'You can request a copy or deletion of your personal data by contacting our support team.',
    ],
  },
};

/**
 * Public legal page rendered from the CMS content API
 * (/content/:slug) with a static fallback so the route never 404s.
 */
export default async function LegalPage({ slug }: { slug: string }) {
  const fallback = FALLBACKS[slug] ?? FALLBACKS.terms;
  let title = fallback.title;
  let paragraphs = fallback.body;

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(apiBase + '/content/' + slug, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      const page = json.data ?? json;
      if (page && page.title && page.content) {
        title = page.title;
        paragraphs = String(page.content).split(/\n+/).filter(Boolean);
      }
    }
  } catch {
    // Static fallback stays
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{title}</h1>
      <Card className="border border-border">
        <CardContent className="prose-sm space-y-4 p-6 text-muted-foreground md:p-8">
          {paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
