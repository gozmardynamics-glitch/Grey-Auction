'use client';

import Link from 'next/link';
import { Landmark, Globe2, Building2, Lock, ArrowRight } from 'lucide-react';

const AUCTION_TYPES = [
  {
    title: 'Government',
    description: 'Public tenders, agency surplus and state assets',
    icon: Landmark,
    category: 'Government',
  },
  {
    title: 'Embassy',
    description: 'Diplomatic missions and expat household lots',
    icon: Globe2,
    category: 'Embassy',
  },
  {
    title: 'Corporate',
    description: 'Fleet liquidation, office and equipment auctions',
    icon: Building2,
    category: 'Corporate',
  },
  {
    title: 'Private Room',
    description: 'Invitation-only sales for verified members',
    icon: Lock,
    category: 'Private Room',
  },
];

export default function AuctionTypesSection() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-0.5">Curated Sales</p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Browse by Auction Type</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AUCTION_TYPES.map(({ title, description, icon: Icon, category }) => (
          <Link
            key={title}
            href={`/auctions?category=${encodeURIComponent(category)}`}
            className="reveal group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 soft-border hover-card-accent transition-all duration-300"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">{description}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              View auctions
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}