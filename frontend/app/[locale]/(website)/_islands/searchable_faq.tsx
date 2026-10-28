'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, LifeBuoy, Link2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  EmptyState,
  InputWithIcon,
} from '@/shared/components/common';
import type { FAQCategory } from '../models';

interface SearchableFaqProps {
  faqCategories: FAQCategory[];
}

type Audience = 'all' | 'buying' | 'selling';

/**
 * Which reader each category is for.
 *
 * FAQ rows only carry a category name, so the split lives here rather than in
 * the database: a seller scanning the page should not have to read bidding
 * rules, and a buyer should not have to read payout rules to find collection.
 */
const CATEGORY_AUDIENCE: Record<string, Audience> = {
  'Getting started': 'all',
  'Buying and bidding': 'buying',
  'Paying and invoices': 'buying',
  'Collecting your lot': 'buying',
  'Selling with GreyAuction': 'selling',
  'Fees and payouts': 'selling',
  'Private rooms and invitations': 'all',
  'Verification and account': 'all',
  'Disputes, refunds and rules': 'all',
};

const TABS: { key: Audience; label: string; hint: string }[] = [
  { key: 'all', label: 'Everything', hint: 'Every question' },
  { key: 'buying', label: 'Buying', hint: 'Bidding, paying, collecting' },
  { key: 'selling', label: 'Selling', hint: 'Listing, fees, payouts' },
];

const audienceOf = (category: string): Audience => CATEGORY_AUDIENCE[category] ?? 'all';

export default function SearchableFaq({ faqCategories }: SearchableFaqProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const total = faqCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faqCategories
      .filter((cat) => (audience === 'all' ? true : audienceOf(cat.name) === audience || audienceOf(cat.name) === 'all'))
      .filter((cat) => (category ? cat.name === category : true))
      .map((cat) => ({
        ...cat,
        items: needle
          ? cat.items.filter(
              (item) =>
                item.question.toLowerCase().includes(needle) ||
                item.answer.toLowerCase().includes(needle),
            )
          : cat.items,
      }))
      .filter((cat) => cat.items.length > 0);
  }, [faqCategories, audience, category, query]);

  // Deep link: /faq#why-was-my-bid-rejected should open that answer and reveal
  // the right tab, so support can point at a single answer.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const owner = faqCategories.find((cat) => cat.items.some((item) => item.id === hash));
    if (!owner) return;
    setAudience(audienceOf(owner.name) === 'selling' ? 'selling' : 'all');
    setCategory(null);
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => clearTimeout(timer);
  }, [faqCategories]);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable — the address bar still shows the anchor */
    }
  };

  const matchCount = visible.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <>
      {/* Search */}
      <div className="relative mx-auto mb-6 max-w-xl">
        <InputWithIcon
          type="search"
          placeholder={`Search ${total} answers — try “reserve”, “payout”, “invite”`}
          icon={Search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Audience tabs */}
      <div
        role="tablist"
        aria-label="Who the answer is for"
        className="mx-auto mb-4 flex max-w-xl items-center justify-center gap-1 rounded-lg border border-border/60 bg-card p-1"
      >
        {TABS.map((tab) => {
          const active = audience === tab.key;
          const count =
            tab.key === 'all'
              ? total
              : faqCategories
                  .filter((cat) => audienceOf(cat.name) === tab.key)
                  .reduce((sum, cat) => sum + cat.items.length, 0);
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              title={tab.hint}
              onClick={() => {
                setAudience(tab.key);
                setCategory(null);
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${active ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Category chips — these now filter, they are not decoration. */}
      <div className="mx-auto mb-2 flex max-w-4xl flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            category === null
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          All topics
        </button>
        {faqCategories
          .filter((cat) => audience === 'all' || audienceOf(cat.name) === audience || audienceOf(cat.name) === 'all')
          .map((cat) => {
            const active = category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setCategory(active ? null : cat.name)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span aria-hidden>{cat.emoji}</span>
                {cat.name}
                <span className="opacity-60">{cat.items.length}</span>
              </button>
            );
          })}
      </div>

      {(query || category) && (
        <p className="mb-6 text-center text-xs text-muted-foreground">
          {matchCount} answer{matchCount === 1 ? '' : 's'} match
          {category ? ` in ${category}` : ''}
          {query ? ` for “${query}”` : ''}
          {' · '}
          <button
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              setQuery('');
              setCategory(null);
            }}
          >
            clear
          </button>
        </p>
      )}

      {/* Sections */}
      <div className="mx-auto mt-10 max-w-4xl space-y-10">
        {visible.map((section) => (
          <section key={section.name} id={`topic-${section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {section.emoji}
              </span>
              <h2 className="text-lg font-semibold">{section.name}</h2>
              <span className="text-xs text-muted-foreground">{section.items.length}</span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item) => {
                const anchor =
                  item.id ??
                  item.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                return (
                <AccordionItem key={anchor} value={anchor} id={anchor} className="scroll-mt-24">
                  <div className="flex items-start gap-2">
                    <AccordionTrigger className="flex-1 text-left text-sm font-medium text-primary hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <button
                      type="button"
                      onClick={() => void copyLink(anchor)}
                      aria-label={`Copy link to “${item.question}”`}
                      title={copied === anchor ? 'Link copied' : 'Copy link to this answer'}
                      className="mt-3 shrink-0 rounded p-1 text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Answers are written in paragraphs; pre-line keeps them readable. */}
                  <AccordionContent className="whitespace-pre-line pr-6 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        ))}

        {visible.length === 0 && (
          <EmptyState
            title="No answer matched that"
            description="Try a different word — or send us the question and we will answer it and add it here."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setCategory(null);
                  }}
                >
                  Clear search
                </Button>
                <Button onClick={() => router.push('/contact')}>Ask support</Button>
              </div>
            }
          />
        )}
      </div>

      {/* Closing help card: the FAQ's job is to make this unnecessary, not to
          replace it. Kept as two clear routes rather than a bare email address. */}
      <div className="mx-auto mt-14 max-w-4xl rounded-xl border border-border/60 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Still stuck?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a ticket and we reply in your dashboard — include the lot or invoice
                number and you will get an answer in one go.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push('/contact')}>
              Contact support
            </Button>
            <Button onClick={() => router.push('/auctions')}>
              Browse auctions
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Small print: what this page is not. */}
      <p className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        This FAQ explains how the platform works. The Terms and Conditions are the binding
        agreement.
      </p>
    </>
  );
}
