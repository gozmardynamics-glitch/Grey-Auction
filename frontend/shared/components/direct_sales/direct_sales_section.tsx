'use client';

import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { Card } from '@/shared/components/common';
import { Money } from '@/shared/currency';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DirectSaleItem {
  id: string;
  slug?: string;
  title: string;
  images?: string[];
  buyNowPrice?: number;
  startingBid?: number;
  city?: string;
  country?: string;
}

/**
 * Direct-sales section (L8): buy-now lots (auctionType=direct_sale), no bidding.
 */
export function DirectSalesSection({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<DirectSaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_BASE + '/products?auctionType=direct_sale&limit=' + limit, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setItems(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading buy-now lots...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No buy-now listings right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const price = it.buyNowPrice ?? it.startingBid ?? 0;
        const image = it.images && it.images.length ? it.images[0] : '/placeholder.svg';
        const href = '/' + (it.slug || it.id);
        return (
          <a key={it.id} href={href} data-testid="direct-sale-card" className="group">
            <Card className="overflow-hidden transition group-hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 text-sm font-medium">{it.title}</p>
                <p className="text-sm font-semibold text-primary"><Money amount={price} /></p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  Buy now {it.city ? ' - ' + it.city : ''}
                </p>
              </div>
            </Card>
          </a>
        );
      })}
    </div>
  );
}

export default DirectSalesSection;
