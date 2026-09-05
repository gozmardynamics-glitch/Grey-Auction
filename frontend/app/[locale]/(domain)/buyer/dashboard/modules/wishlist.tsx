'use client';

import { Heart, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, Input } from '@/shared/components/common';
import WishlistCard from '../components/wishlist/wishlist_card';
import { wishlistItems } from '../../models/data';

export default function BuyerWishlistModule() {
  const t = useTranslations('buyer.wishlist');
  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="relative w-full sm:w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 bg-card" />
        </div>
      </div>

      {/* Card Grid */}
      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-10 w-10" />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
