'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { setSelectedCategory } from '@/redux/slices/categories.slice';
import { Skeleton } from '@/shared/components/common';
import Banner from '../components/banner';
import type { Auction, Category } from '../models';

const sectionLoader = () => <Skeleton className="h-[300px] w-full rounded-xl" />;

const FeaturedAuctions = dynamic(
  () => import('../components/featured_auctions/featured_auctions'),
  { loading: sectionLoader }
);
const CategoriesCarousel = dynamic(
  () => import('../components/categories/categories_carousel'),
  { loading: sectionLoader }
);
const FeaturedActiveAuctions = dynamic(
  () => import('../components/featured_active_auctions'),
  { loading: sectionLoader }
);
const FeaturedCosmeticsAuctions = dynamic(
  () => import('../components/featured_cosmetic_auctions'),
  { loading: sectionLoader }
);
const TrendingLots = dynamic(
  () => import('../components/trending_lots/trending_lots'),
  { loading: sectionLoader }
);

interface HomepageClientSectionProps {
  auctions: Auction[];
  categories: Category[];
}

export default function HomepageClientSection({
  auctions,
  categories,
}: HomepageClientSectionProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const selectedCategory =
    useAppSelector((state) => state.categories.selectedCategory) ||
    categories[0]?.slug ||
    '';

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/auctions?category=${categorySlug}`);
  };

  const handleSubCategoryClick = (
    categorySlug: string,
    subCategorySlug: string
  ) => {
    router.push(`/auctions?category=${categorySlug}&subCategory=${subCategorySlug}`);
  };

  return (
    <>
      <Banner />
      <FeaturedAuctions auctions={auctions} />
      <FeaturedActiveAuctions auctions={auctions} />
      <CategoriesCarousel
        selectedCategory={selectedCategory}
        onCategorySelect={(categorySlug) =>
          dispatch(setSelectedCategory(categorySlug || categories[0]?.slug || ''))
        }
      />
      <FeaturedCosmeticsAuctions
        onCategoryClick={handleCategoryClick}
        onSubCategoryClick={handleSubCategoryClick}
      />
      <TrendingLots selectedCategory={selectedCategory} />
    </>
  );
}
