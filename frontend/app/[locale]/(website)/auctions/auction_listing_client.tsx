'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { Card, CardContent } from '@/shared/components/common/card';
import { Button } from '@/shared/components/common/button';
import { EmptyState } from '@/shared/components/common/empty_state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common/select';

import { TablePagination } from '@/shared/components/common/table_pagination';
import { Breadcrumbs } from '@/shared/components/common/breadcrumbs';
import type { BreadcrumbItemData } from '@/shared/components/common/breadcrumbs';
import { LayoutGrid, List, Funnel, X } from 'lucide-react';

import FilterSidebar from './filter_sidebar';
import { AuctionCard } from '../components/featured_auctions/auction_card';
import {
  setFilters,
  clearFilters,
  setAuctions,
} from '@/redux/auctions/slices/auctions.slice';
import {
  setViewMode,
  setCurrentPage,
  setMobileFiltersOpen,
} from '@/redux/slices/ui.slice';
import LatestAuctionsBanner from '../components/latest_auctions';
import { CATEGORIES_MAP, BRANCH_CATEGORIES } from '@/shared/data/categories';
import { CategorySubcategoryTabs } from './category_subcategory_tabs';
import type { Auction } from '../models';

const ITEMS_PER_PAGE = 12;

interface AuctionListingClientProps {
  initialAuctions: Auction[];
}

export default function AuctionListingClient({
  initialAuctions,
}: AuctionListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // SSR-safe: the URL-driven category crumb only appears after mount so the
  // server HTML and the first client render can never diverge.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filters = useAppSelector((state) => state.auctions.filters);
  const currentPage = useAppSelector((state) => state.ui.currentPage);
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const mobileFiltersOpen = useAppSelector((state) => state.ui.mobileFiltersOpen);
  const auctions = useAppSelector((state) => state.auctions.auctions);

  const activeCategory = filters.categories.length === 1 ? filters.categories[0] : '';
  const subOptions = activeCategory && BRANCH_CATEGORIES.includes(activeCategory) ? CATEGORIES_MAP[activeCategory] || [] : [];

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];
    if (filters.categories.length > 0) {
      result = result.filter((a) => filters.categories.includes(a.category || ''));
    }
    if (activeCategory && filters.subCategory) {
      result = result.filter((a) => (a.subCategory || '') === filters.subCategory);
    }
    if (filters.sortBy === 'price-asc') {
      result.sort((a, b) => a.currentBid - b.currentBid);
    } else if (filters.sortBy === 'price-desc') {
      result.sort((a, b) => b.currentBid - a.currentBid);
    }
    return result;
  }, [auctions, filters]);

  const activeFilterCount = useMemo(
    () =>
      filters.categories.length +
      filters.countries.length +
      filters.brands.length +
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000000 ? 1 : 0),
    [filters]
  );

  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    const items: BreadcrumbItemData[] = [
      { label: 'Home', href: '/' },
      { label: 'Auctions' },
    ];
    if (mounted && filters.categories.length > 0) {
      const categorySlug = filters.categories[0];
      const displayName = categorySlug
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      items.splice(1, 0, {
        label: displayName,
        href: `/auctions?category=${categorySlug}`,
      });
      items[items.length - 1] = { label: displayName };
    }
    return items;
  }, [filters.categories, mounted]);

  // Initialize auctions data in Redux
  useEffect(() => {
    if (auctions.length === 0) {
      dispatch(setAuctions(initialAuctions));
    }
  }, [dispatch, auctions.length, initialAuctions]);

  // Sync URL category + subcategory query params to Redux filters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subParam = searchParams.get('subcategory');
    if (categoryParam) {
      dispatch(
        setFilters({
          categories: [categoryParam],
          subCategory: subParam || '',
        })
      );
      dispatch(setCurrentPage(1));
    }
    // Only run on mount / when searchParams change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Memoized Handlers ──────────────────────────────────────────────
  const onBidClick = useCallback(
    (id: string) => router.push(`/auctions/${id}`),
    [router]
  );

  const onWishlistClick = useCallback(
    () => {},
    []
  );

  const onShareClick = useCallback(
    () => {},
    []
  );

  const clearFiltersHandler = useCallback(() => {
    dispatch(clearFilters());
    dispatch(setCurrentPage(1));
  }, [dispatch]);

  // Per-arm counts for the subcategory tabs (scoped to the active category)
  const subCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!activeCategory) return counts;
    for (const a of auctions) {
      if ((a.category || '') === activeCategory) {
        const s = a.subCategory || '';
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [auctions, activeCategory]);

  const handleSubCategorySelect = useCallback(
    (sub: string) => {
      dispatch(setFilters({ subCategory: sub }));
      dispatch(setCurrentPage(1));
      const q = new URLSearchParams(searchParams.toString());
      if (sub) q.set('subcategory', sub);
      else q.delete('subcategory');
      router.replace(`/auctions?${q.toString()}`, { scroll: false });
    },
    [dispatch, searchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => dispatch(setCurrentPage(page)),
    [dispatch]
  );

  // ─── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredAuctions.length / ITEMS_PER_PAGE);
  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredAuctions.length
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* ─── Desktop Sidebar ──────────────────────────────────── */}
          <aside className="hidden w-[260px] shrink-0 lg:block">
            <Card className="sticky top-6 border-none bg-background">
              <CardContent className="p-0">
                <FilterSidebar />
              </CardContent>
            </Card>
          </aside>

          {/* ─── Mobile Filter Button (bottom FAB for small screens without title header) ─── */}
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:hidden lg:hidden">
            <Button
              onClick={() => dispatch(setMobileFiltersOpen(true))}
              className="gap-2 rounded-full shadow-lg"
            >
              <Funnel className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* ─── Mobile Filter Drawer ─────────────────────────────── */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => dispatch(setMobileFiltersOpen(false))}
              />
              <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(setMobileFiltersOpen(false))}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <FilterSidebar />
                <div className="mt-6">
                  <Button
                    className="w-full"
                    onClick={() => dispatch(setMobileFiltersOpen(false))}
                  >
                    Show {filteredAuctions.length} results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Main Content ─────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Institutional-arm tabs (Government / Embassy / Corporate …) */}
            {subOptions.length > 0 && (
              <CategorySubcategoryTabs
                options={subOptions}
                selected={filters.subCategory || ''}
                counts={subCounts}
                total={(subCounts[''] || 0) + subOptions.reduce((acc, o) => acc + (subCounts[o] || 0), 0)}
                onSelect={handleSubCategorySelect}
              />
            )}

            {/* Mobile Title + Filter Icon */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-bold text-foreground">Auctions</h1>
              <Button
                variant="outline"
                size="icon"
                onClick={() => dispatch(setMobileFiltersOpen(true))}
                className="rounded-lg"
                aria-label="Open filters"
              >
                <Funnel className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {startItem}-{endItem}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                  {filteredAuctions.length}
                </span>{' '}
                results
              </p>

              <div className="flex items-center gap-3">
                {/* View Toggle - visible on all sizes */}
                <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => dispatch(setViewMode('grid'))}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => dispatch(setViewMode('list'))}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort - hidden on mobile */}
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    dispatch(
                      setFilters({
                        ...filters,
                        sortBy: value as 'default' | 'price-asc' | 'price-desc',
                      })
                    )
                  }
                >
                  <SelectTrigger className="hidden w-[160px] sm:flex">
                    <SelectValue placeholder="Default sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default sorting</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="ending-soon">Ending soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auction Grid */}
            {paginatedAuctions.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-4'
                }
              >
                {paginatedAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    viewMode={viewMode}
                    onBidClick={onBidClick}
                    onWishlistClick={onWishlistClick}
                    onShareClick={onShareClick}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No auctions found"
                description="Try adjusting your filters to find what you're looking for."
                action={
                  <Button variant="outline" onClick={clearFiltersHandler}>
                    Clear all filters
                  </Button>
                }
              />
            )}

            {/* Pagination */}
            <div className="mt-8">
              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAuctions.length}
                  startItem={startItem}
                  endItem={endItem}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
            <LatestAuctionsBanner />
          </div>
        </div>
      </div>
    </div>
  );
}
