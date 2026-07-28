'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Heart,
  Share2,
  Tag,
  Info,
  CircleQuestionMark,
  Radio,
  TagIcon,
} from 'lucide-react';
import {
  Button,
  Card,
  CountdownTimer,
  Label,
  RadioGroup,
  RadioGroupItem,
  Rating,
  Separator,
  SharedImageGallery,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyH3,
  ShareButtons,
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

import LiveAuctionCard from './components/live_auction_card';
import ActiveAuctionCard from './components/active_auction_card';
import AuctionDetailsGrid from './components/auction_details_grid';
import AuctionSaleInfo from './components/auction_sale_info';
import BidHistoryTable from './components/bid_history_table';
import PlaceBidModal from './components/place_bid_modal';
import ProductTabsContent from './product_tabs_content';
import RelatedLots from '../../components/related_lots/related_lots';
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
  const pathname = usePathname();
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

  const auctionId = auction.id;
  const auctionStatus = auction.status;

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${pathname}`;
    }
    return pathname;
  }, [pathname]);

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

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 space-y-8">
      {/* ─── Top Section: Gallery + Info ─────────────────────────────── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <SharedImageGallery images={images} />

        {/* Auction Info */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">
            Audi RSQ8 Performance 2025 | 02-52-97
          </h1>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-between">
            <span className="rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Lot: # 25896742
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {auction.rating != null && auction.reviewCount != null && (
                <Rating rating={auction.rating} reviewCount={auction.reviewCount} size="md" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground border px-2 sm:px-3 py-1 rounded-full">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bids:{' '}
                {String(bidHistory.length).padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground border px-2 sm:px-3 py-1 rounded-full">
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Sale Status: On
                Minimum Bid
              </span>
            </div>
          </div>

          <Separator />

          {/* Current Bid */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current Bid:</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground border px-3 py-1 rounded-full">
                <Info className="h-4 w-4" /> Seller Reserve Not Yet Met
              </p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(currentBid)}
            </p>
          </div>

          {/* Time Left */}
          <CountdownTimer endTime={auction.endTime} size="md" />

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
            <Card className="space-y-4 p-4">
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
                  onClick={() => router.push('/auth/login')}
                >
                  Browse Inventory
                </Button>
              </div>
            </Card>
          )}

          {/* Action Links */}
          <div className="flex items-center gap-6">
            <Button
              variant="link"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Heart className="h-4 w-4 text-primary" /> Add to Wishlist
            </Button>
          <Button
            variant="link"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <CircleQuestionMark className="h-4 w-4 text-primary" /> Ask about
            product
          </Button>
          <ShareButtons
            url={shareUrl}
            title={auction.title}
            description={auction.description}
          />
          </div>
        </div>
      </div>

      <Separator />

      {/* ─── Auction Details + Sale Info ──────────────────────────────── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <AuctionDetailsGrid details={auctionDetails} />
        <AuctionSaleInfo />
      </div>

      <Separator />

      {/* ─── Tabs + Bid History ───────────────────────────────────────── */}
      <div className="grid gap-8 sm:grid-cols-2">
        <section className="min-w-0">
          <ProductTabsContent />
        </section>

        <section className="min-w-0 space-y-9 p-2">
          <TypographyH3>Bid History</TypographyH3>
          <BidHistoryTable variant="summary" />
          <ADsCard />
        </section>
      </div>

      <RelatedLots selectedCategory={auction?.category || null} />

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
