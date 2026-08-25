'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Share2,
  Tag,
  Info,
  CircleQuestionMark,
  Radio,
  TagIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import {
  Button,
  Card,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyH3,
} from '@/shared/components/common';

import { formatCurrency } from '@/shared/utils/helpers';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import {
  setCurrentAuction,
  setCurrentBid,
  placeBid,
  setBidding,
  setBidError,
  setTimeLeft,
  decrementTimeLeft,
  setAutoBid,
} from '@/redux/slices/bidding.slice';
import type { Auction, AuctionDetail } from '../../models';
import type { BreadcrumbItemData } from '@/shared/components/common/breadcrumbs';
import { Breadcrumbs } from '@/shared/components/common/breadcrumbs';

import ImageGallery from './components/image_gallery';
import CountdownTimer from './components/countdown_timer';
import LiveAuctionCard from './components/live_auction_card';
import ActiveAuctionCard from './components/active_auction_card';
import AuctionDetailsGrid from './components/auction_details_grid';
import AuctionSaleInfo from './components/auction_sale_info';
import BidHistoryTable from './components/bid_history_table';
import PlaceBidModal from './components/place_bid_modal';
import ProductTabsContent from './product_tabs_content';
import RelatedLots from '../../components/related_lots/related_lots';
import MoreFromSeller from '../../components/more_from_seller';
import AIRecommendations from '../../components/ai_recommendations';
import ADsCard from '../../components/ads_card';

interface ProductDetailsClientProps {
  auction: Auction;
  images: string[];
  auctionDetails: AuctionDetail[];
}

export default function ProductDetailsClient({
  auction,
  images,
  auctionDetails,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentBid = useAppSelector((state) => state.bidding.currentBid);
  const bidHistory = useAppSelector((state) => state.bidding.bidHistory);
  const authUser = useAppSelector((state) => state.auth.user);
  const authToken = useAppSelector((state) => state.auth.token);
  const isLoggedIn = useAppSelector((state) => state.auth.isAuthenticated);

  const [bidType, setBidType] = useState('maximum');
  const [bidAmount, setBidAmount] = useState(0);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidModalStep, setBidModalStep] = useState<'confirm' | 'success'>(
    'confirm'
  );
  const [copied, setCopied] = useState(false);

  const auctionId = auction.id;
  const auctionStatus = auction.status;

  // Initialize auction state
  useEffect(() => {
    dispatch(setCurrentAuction(auctionId));
    dispatch(setCurrentBid(auction.currentBid));
    dispatch(setTimeLeft(3600));
  }, [dispatch, auctionId, auction.currentBid]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(decrementTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  // ─── Memoized Handlers ──────────────────────────────────────────────
  const handleBidAmountChange = useCallback((value: number) => {
    setBidAmount(value);
  }, []);

  const handlePlaceBid = useCallback(() => {
    if (bidAmount <= currentBid) {
      dispatch(setBidError('Bid must be higher than current bid'));
      return;
    }
    dispatch(setBidError(null));
    setBidModalStep('confirm');
    setBidModalOpen(true);
  }, [bidAmount, currentBid, dispatch]);

  const handleConfirmBid = useCallback(async () => {
    dispatch(setBidding(true));
    dispatch(setBidError(null));

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ amount: bidAmount }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Bid failed');
      }

      dispatch(
        placeBid({
          amount: bidAmount,
          auctionId,
          bidderId: authUser?.id ?? 'anonymous',
          bidderName: authUser?.name ?? 'Anonymous',
        })
      );
      setBidAmount(0);
      setBidModalStep('success');
    } catch (err: any) {
      dispatch(setBidError(err.message || 'Failed to place bid. Please try again.'));
      setBidModalOpen(false);
    } finally {
      dispatch(setBidding(false));
    }
  }, [bidAmount, auctionId, authUser, authToken, dispatch]);

  const handleBidModalClose = useCallback(() => {
    setBidModalOpen(false);
    setBidModalStep('confirm');
  }, []);

  const handleAutoBid = useCallback(() => {
    if (bidAmount <= currentBid) {
      dispatch(setBidError('Maximum bid must be higher than current bid'));
      return;
    }
    dispatch(setAutoBid({ enabled: true, maxAmount: bidAmount }));
    setBidAmount(0);
  }, [bidAmount, currentBid, dispatch]);

  const handleBuyNow = useCallback(() => {
    router.push('/checkout');
  }, [router]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    const categoryDisplay = auction.category
      ? (auction.category || 'Auction').charAt(0).toUpperCase() + (auction.category || 'Auction').slice(1)
      : '';
    return [
      { label: 'Home', href: '/' },
      { label: 'Auctions', href: '/auctions' },
      ...(categoryDisplay
        ? [{ label: categoryDisplay, href: `/auctions?category=${auction.category}` }]
        : []),
      { label: auction.title },
    ];
  }, [auction.category, auction.title]);

  // Lot specifications (structured data)
  const lotSpecifications = [
    { label: 'Brand', value: auction.title?.split(' ')[0] || 'N/A' },
    { label: 'Type', value: auction.specs || 'N/A' },
    { label: 'Category', value: auction.category || 'N/A' },
    { label: 'Status', value: auction.status || 'N/A' },
    { label: 'Starting Bid', value: formatCurrency(auction.startingBid) },
    { label: 'Current Bid', value: formatCurrency(currentBid) },
    { label: 'Total Bids', value: String(bidHistory.length) },
    { label: 'Seller', value: auction.sellerName || 'N/A' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 space-y-8">
      <Breadcrumbs items={breadcrumbItems} />

      {/* ─── Lot Navigation Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Tag className="h-3 w-3" />
            Lot: # {auction.id?.slice(0, 8).toUpperCase() || '25896742'}
          </span>
          {auction.location && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {auction.location.city}, {auction.location.country}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous Lot
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            Next Lot
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Top Section: Gallery + Info ─────────────────────────────── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <ImageGallery
          images={images}
          title={auction.title}
          auctionId={auctionId}
        />

        {/* Auction Info */}
        <div className="space-y-5">
          {/* Title + Share */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground">
                {auction.title || 'Audi RSQ8 Performance 2025 | 02-52-97'}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Parent auction link */}
            <a
              href="/auctions"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline"
            >
              Part of: Featured Auctions Collection
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Lot: # {auction.id?.slice(0, 8).toUpperCase() || '25896742'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Bids: {String(bidHistory.length).padStart(2, '0')}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Sale Status: On Minimum Bid
            </span>
          </div>

          <Separator />

          {/* Current Bid */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current Bid:</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground border border-amber-200 bg-amber-50 px-2.5 py-1 rounded-full">
                <Info className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-amber-800">Seller Reserve Not Yet Met</span>
              </p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(currentBid)}
            </p>
          </div>

          {/* Time Left */}
          <CountdownTimer />

          <Separator />

          {/* ─── Live Auction — Logged In ──────────────────────── */}
          {auctionStatus === 'live' && isLoggedIn && (
            <LiveAuctionCard
              bidAmount={bidAmount}
              onBidAmountChange={handleBidAmountChange}
              onPlaceBid={handlePlaceBid}
            />
          )}

          {/* ─── Live Auction — Not Logged In ────────────────────── */}
          {auctionStatus === 'live' && !isLoggedIn && (
            <Card className="space-y-4 bg-tertiary/10 p-4">
              <div className="inline-flex items-center gap-2 rounded-full text-xs bg-tertiary text-primary-foreground px-3 py-1">
                <Radio size={15} />
                <span className="font-semibold">Live Auction In Progress</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Preliminary bidding is now closed. Sign in or register to
                continue with live bidding.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-primary/10 text-primary border-primary"
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push('/auth/buyer/register')}
                >
                  Register to Bid
                </Button>
              </div>
            </Card>
          )}

          {/* ─── Not logged in — prompt to register ────────────── */}
          {auctionStatus === 'active' && !isLoggedIn && (
            <Card className="space-y-4 p-4 border border-border/50">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Your Bid:</p>
                <RadioGroup
                  value={bidType}
                  onValueChange={setBidType}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="maximum" id="maximum" />
                    <Label htmlFor="maximum" className="text-sm">
                      Maximum Bid
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set the highest amount you&apos;re willing to bid. The system will bid on your behalf up to this limit.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="automatic" id="automatic" />
                    <Label htmlFor="automatic" className="text-sm">
                      Monster/Automatic Bid
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Automatically outbid other bidders up to your maximum amount.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/auth/buyer/register')}
              >
                Register to Bid
              </Button>
            </Card>
          )}

          {/* ─── Logged in — active bidding ─────────────────────── */}
          {(auctionStatus === 'active' || auctionStatus === 'new') &&
            isLoggedIn && (
              <ActiveAuctionCard
                bidType={bidType}
                onBidTypeChange={setBidType}
                bidAmount={bidAmount}
                onBidAmountChange={handleBidAmountChange}
                onPlaceBid={handlePlaceBid}
                onAutoBid={handleAutoBid}
                onBuyNow={handleBuyNow}
              />
            )}

          {/* ─── Sold ────────────────────── */}
          {auctionStatus === 'sold' && (
            <Card className="space-y-4 bg-destructive/10 p-4">
              <div className="inline-flex items-center gap-2 rounded-full text-xs bg-destructive text-primary-foreground px-3 py-1">
                <TagIcon size={15} />
                <span className="font-semibold">Sold</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The auction for this item has ended. Explore our current
                inventory to discover other available items.
              </p>
              <div>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => router.push('/auctions')}
                >
                  Browse Inventory
                </Button>
              </div>
            </Card>
          )}

          {/* AI Features Card */}
          <Card className="border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-1">AI-Powered Insights</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Get AI-generated recommendations and market analysis for this item.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Price Estimate
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Similar Items
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Market Analysis
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Links */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="link"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer p-0"
            >
              <Heart className="h-4 w-4 text-primary" /> Add to Wishlist
            </Button>
            <Button
              variant="link"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer p-0"
            >
              <CircleQuestionMark className="h-4 w-4 text-primary" /> Ask about product
            </Button>
            <Button
              variant="link"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer p-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Share2 className="h-4 w-4 text-primary" />
              )}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ─── Lot Specifications + Sale Info ──────────────────────────────── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <AuctionDetailsGrid
          details={auctionDetails}
          specifications={lotSpecifications}
          location={auction.location ? {
            city: auction.location.city,
            country: auction.location.country,
            countryCode: auction.location.countryCode,
            address: 'Victoria Island, Lagos',
          } : undefined}
          lotId={`#${auction.id?.slice(0, 8).toUpperCase() || '25896742'}`}
          sellerName={auction.sellerName || 'Grey Automobile'}
          parentAuction={{
            name: 'Featured Auctions',
            slug: 'featured',
          }}
        />
        <AuctionSaleInfo />
      </div>

      <Separator />

      {/* ─── Tabs + Bid History ───────────────────────────────────────── */}
      <div className="grid gap-8 sm:grid-cols-2">
        <section className="min-w-0">
          <ProductTabsContent />
        </section>

        <section className="min-w-0 space-y-6 p-2">
          <BidHistoryTable variant="summary" />
          <ADsCard />
        </section>
      </div>

      <RelatedLots selectedCategory={auction?.category || null} />

      {/* More from this Seller */}
      <MoreFromSeller
        sellerId={auction.sellerId || 'seller1'}
        sellerName={auction.sellerName || 'Seller'}
        currentAuctionId={auctionId}
      />

      {/* AI-Powered Recommendations */}
      <AIRecommendations
        currentAuctionId={auctionId}
        category={auction.category || 'transport'}
        sellerId={auction.sellerId || 'seller1'}
      />

      {/* ─── Place a Bid Modal ────────────────────────────────────────── */}
      <PlaceBidModal
        open={bidModalOpen}
        onClose={handleBidModalClose}
        bidAmount={bidAmount}
        auctionId={auctionId}
        onConfirm={handleConfirmBid}
        bidModalStep={bidModalStep}
      />
    </div>
  );
}
