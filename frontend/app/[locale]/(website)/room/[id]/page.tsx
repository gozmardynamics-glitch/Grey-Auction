'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import Image from 'next/image';
import {
  Lock,
  Clock,
  Gavel,
  Users,
  Shield,
  Radio,
  CheckCircle2,
  XCircle,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  Badge,
  Skeleton,
  Input,
  Label,
} from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useAppSelector } from '@/redux/store';
import type { Socket } from 'socket.io-client';

interface RoomAuction {
  id: string;
  title: string;
  imageUrl?: string;
  currentBid: number;
  totalBids: number;
  status: string;
}

interface RoomData {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  status: 'scheduled' | 'live' | 'closed' | 'cancelled' | 'settled';
  startTime: string;
  endTime: string;
  requiresDeposit: boolean;
  depositAmount?: number;
  auctionCount?: number;
  productIds?: string[];
}

interface LiveBid {
  id: string;
  bidderName?: string;
  amount: number;
  createdAt?: string;
  isAutoBid?: boolean;
}

interface FeaturedProduct {
  id: string;
  title: string;
  imageUrl?: string;
  currentBid: number;
  totalBids: number;
  endTime?: string;
}

const STATUS_STEPS = [
  { key: 'scheduled', label: 'Scheduled', icon: Clock },
  { key: 'live', label: 'Live', icon: Radio },
  { key: 'closed', label: 'Closed', icon: CheckCircle2 },
] as const;

export default function LiveRoomView({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const authToken = useAppSelector((state) => state.auth.token);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [auctions, setAuctions] = useState<RoomAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ─── Live watch-room state ────────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<FeaturedProduct | null>(null);
  const [liveBids, setLiveBids] = useState<LiveBid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [productCountdown, setProductCountdown] = useState('');

  const prependLiveBid = useCallback((bid: LiveBid) => {
    setLiveBids((prev) => [bid, ...prev].slice(0, 50));
  }, []);

  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/rooms/${roomId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) throw new Error('Room not found');
        const json = await res.json();
        const data = json.data ?? json;
        setRoom(data);
        // First product in the room is the featured watch-room auction.
        const productId = data.productIds?.[0] || data.productId || null;
        setSelectedProductId(productId);
        setAuctions([
          {
            id: productId || data.productIds?.[0] || '1',
            title: 'Featured Auction Item',
            currentBid: 2500000,
            totalBids: 12,
            status: 'active',
          },
        ]);

        // PLACEHOLDER: product/bid-history endpoints may not be reachable in
        // every environment; the socket events below keep the UI in sync when
        // they are. Failures here degrade gracefully to the fallback card.
        if (productId) {
          const [productRes, bidsRes] = await Promise.all([
            fetch(`${apiBase}/products/${productId}`).catch(() => null),
            fetch(`${apiBase}/auctions/${productId}/bids`).catch(() => null),
          ]);
          if (productRes?.ok) {
            const pj = await productRes.json();
            const p = pj.data ?? pj;
            if (p && typeof p === 'object') {
              const featured: FeaturedProduct = {
                id: p.id || productId,
                title: p.title || 'Featured Auction Item',
                imageUrl: p.images?.[0],
                currentBid: Number(p.currentBid) || 0,
                totalBids: Number(p.totalBids) || 0,
                endTime: p.endTime,
              };
              setProduct(featured);
              setAuctions([
                {
                  id: featured.id,
                  title: featured.title,
                  imageUrl: featured.imageUrl,
                  currentBid: featured.currentBid,
                  totalBids: featured.totalBids,
                  status: 'active',
                },
              ]);
            }
          }
          if (bidsRes?.ok) {
            const bj = await bidsRes.json();
            const bids = bj.data ?? bj;
            if (Array.isArray(bids) && bids.length > 0) {
              const mapped: LiveBid[] = bids.map((b: unknown) => {
                const bid = b as {
                  id?: unknown;
                  amount?: unknown;
                  createdAt?: unknown;
                  isAutoBid?: unknown;
                  bidderName?: unknown;
                  bidder?: { name?: unknown };
                };
                return {
                  id: (typeof bid.id === 'string' && bid.id) || `bid-${Date.now()}-${Math.random()}`,
                  bidderName: (typeof bid.bidderName === 'string' && bid.bidderName) || (typeof bid.bidder?.name === 'string' ? bid.bidder.name : undefined) || 'Bidder',
                  amount: Number(bid.amount) || 0,
                  createdAt: typeof bid.createdAt === 'string' ? bid.createdAt : undefined,
                  isAutoBid: !!bid.isAutoBid,
                };
              });
              mapped.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
              setLiveBids(mapped.slice(0, 30));
            }
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    loadRoom();
  }, [roomId, authToken]);

  // Countdown timer
  useEffect(() => {
    if (!room) return;
    const updateTimer = () => {
      const target = room.status === 'live' ? room.endTime : room.startTime;
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(room.status === 'live' ? 'Ended' : 'Live now');
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);
      setTimeLeft(
        days > 0
          ? `${days}d ${hours}h ${mins}m`
          : `${hours}h ${mins}m ${secs}s`
      );
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [room]);

  // Live countdown for the featured product (from its endTime)
  useEffect(() => {
    const endTime = product?.endTime || (room?.status === 'live' ? room?.endTime : null);
    const updateProductCountdown = () => {
      if (!endTime) {
        setProductCountdown('');
        return;
      }
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setProductCountdown('Ended');
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);
      setProductCountdown(
        days > 0
          ? `${days}d ${hours}h ${mins}m`
          : `${hours}h ${mins}m ${secs}s`
      );
    };
    const initial = setTimeout(updateProductCountdown, 0);
    const timer = setInterval(updateProductCountdown, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [product?.endTime, room?.status, room?.endTime]);

  // WebSocket connection
  useEffect(() => {
    if (!room || room.status !== 'live') return;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        // Connect to the API origin (without the /api path) on the '/auctions' namespace
        const configured = process.env.NEXT_PUBLIC_API_URL;
        const apiOrigin = configured ? new URL(configured).origin : 'http://localhost:3001';
        const socket = io(`${apiOrigin}/auctions`, {
          auth: { token: authToken },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('joinRoom', { roomId: room.id });
          // The backend broadcasts bid events to the product room, so join it too.
          if (selectedProductId) socket.emit('joinRoom', { roomId: selectedProductId });
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('newBid', (data: unknown) => {
          const payload = data as { productId?: unknown; bid?: unknown } | null | undefined;
          const productId = payload?.productId;
          const bid = payload?.bid as {
            id?: unknown;
            amount?: unknown;
            createdAt?: unknown;
            isAutoBid?: unknown;
            bidderName?: unknown;
            bidder?: { name?: unknown };
          } | undefined;
          if (!productId || !bid) return;
          const amount = Number(bid.amount) || 0;
          setAuctions((prev) =>
            prev.map((a) =>
              a.id === productId
                ? { ...a, currentBid: amount || a.currentBid, totalBids: (a.totalBids || 0) + 1 }
                : a
            )
          );
          setProduct((prev) =>
            prev && prev.id === productId
              ? { ...prev, currentBid: amount || prev.currentBid, totalBids: (prev.totalBids || 0) + 1 }
              : prev
          );
          prependLiveBid({
            id: (typeof bid.id === 'string' && bid.id) || `bid-${Date.now()}`,
            bidderName: (typeof bid.bidderName === 'string' && bid.bidderName) || (typeof bid.bidder?.name === 'string' ? bid.bidder.name : undefined),
            amount,
            createdAt: typeof bid.createdAt === 'string' ? bid.createdAt : undefined,
            isAutoBid: !!bid.isAutoBid,
          });
        });
        socket.on('bidUpdate', (data: unknown) => {
          const payload = data as { productId?: unknown; currentBid?: unknown; totalBids?: unknown } | null | undefined;
          const productId = payload?.productId;
          if (!productId) return;
          const currentBid = payload.currentBid;
          const totalBids = payload.totalBids;
          const nextBid = typeof currentBid === 'number' ? currentBid : undefined;
          const nextTotal = typeof totalBids === 'number' ? totalBids : undefined;
          setAuctions((prev) =>
            prev.map((a) =>
              a.id === productId
                ? { ...a, currentBid: nextBid ?? a.currentBid, totalBids: nextTotal ?? a.totalBids }
                : a
            )
          );
          setProduct((prev) =>
            prev && prev.id === productId
              ? { ...prev, currentBid: nextBid ?? prev.currentBid, totalBids: nextTotal ?? prev.totalBids }
              : prev
          );
        });
        socket.on('roomEnding', () => {
          // Show ending warning (kept from the original page)
        });
        socket.on('roomEnded', () => {
          setRoom((prev) => (prev ? { ...prev, status: 'closed' } : prev));
        });
      } catch {
        // Socket not available, continue without realtime
      }
    };
    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [room, authToken, selectedProductId, prependLiveBid]);

  // Place a bid on the featured product
  const handlePlaceBid = useCallback(async () => {
    if (!selectedProductId) return;
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    const parsedMax = Number(maxBid);
    const payload: { amount: number; maxBid?: number } = { amount };
    if (maxBid && !isNaN(parsedMax) && parsedMax > 0) payload.maxBid = parsedMax;
    try {
      setIsPlacingBid(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/auctions/${selectedProductId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to place bid');
      }
      const bid = json?.data;
      if (bid) {
        const amountNum = Number(bid.amount) || amount;
        prependLiveBid({
          id: bid.id || `bid-${Date.now()}`,
          bidderName: bid.bidderName || (bid.bidder?.name as string | undefined) || 'You',
          amount: amountNum,
          createdAt: bid.createdAt,
          isAutoBid: !!bid.isAutoBid,
        });
        setProduct((prev) =>
          prev
            ? { ...prev, currentBid: amountNum, totalBids: (prev.totalBids || 0) + 1 }
            : prev
        );
      }
      setBidAmount('');
      setMaxBid('');
      toast.success('Bid placed successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  }, [selectedProductId, bidAmount, maxBid, authToken, prependLiveBid]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-8 text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error || 'Room not found'}</p>
        </Card>
      </div>
    );
  }

  const isPrivate = room.type === 'private';
  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.key === room.status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      {/* Room Header */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isPrivate ? (
                <Badge className="gap-1 bg-slate-800 text-white border-0">
                  <Lock className="h-3 w-3" />
                  Private Room
                </Badge>
              ) : (
                <Badge variant="outline">Public Room</Badge>
              )}
              {room.status === 'live' && (
                <Badge className="gap-1 bg-red-500 text-white border-0 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Live
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{room.name}</h1>
            {room.description && (
              <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
            )}
          </div>
          {/* Timer */}
          <div className="shrink-0 rounded-xl bg-card border border-border p-4 text-center min-w-[140px]">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {room.status === 'scheduled' ? 'Starts In' : room.status === 'live' ? 'Ends In' : 'Ended'}
            </p>
            <p className="text-xl font-bold tabular-nums text-primary">
              {room.status === 'live' ? (
                <Timer className="inline h-5 w-5 mr-1" />
              ) : (
                <Clock className="inline h-5 w-5 mr-1" />
              )}
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-6 flex items-center gap-0">
          {STATUS_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = idx < currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-medium ${
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 flex-1 rounded ${
                      idx < currentStatusIndex ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit warning */}
      {room.requiresDeposit && room.status !== 'closed' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Deposit Required</p>
            <p className="text-xs text-amber-700">
              A deposit of {formatCurrency(room.depositAmount || 0)} is required to bid in this room.
            </p>
          </div>
          <Button size="sm" className="ml-auto shrink-0" variant="outline">
            Pay Deposit
          </Button>
        </div>
      )}

      {/* Live indicator */}
      {room.status === 'live' && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-muted-foreground">
            {connected ? 'Connected to live auction' : 'Connecting...'}
          </span>
        </div>
      )}

      {/* Auctions Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Gavel className="h-5 w-5 text-primary" />
            Room Auctions
            <span className="text-sm font-normal text-muted-foreground">
              ({auctions.length})
            </span>
          </h2>
          {room.status === 'live' && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Live bidding enabled
            </span>
          )}
        </div>

        {auctions.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {room.status === 'scheduled'
                ? 'Auctions will appear here when the room goes live.'
                : 'No auctions in this room yet.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <Card key={auction.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-36 bg-muted overflow-hidden">
                  {auction.imageUrl && (
                    <Image
                      src={auction.imageUrl}
                      alt={auction.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                  {room.status === 'live' && (
                    <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white animate-pulse">
                      Live
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold line-clamp-1">{auction.title}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Current Bid
                      </p>
                      <p className="text-base font-bold">{formatCurrency(auction.currentBid)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {auction.totalBids} bids
                    </div>
                  </div>
                  {room.status === 'live' ? (
                    <Button className="w-full" size="sm">
                      Bid Now
                    </Button>
                  ) : room.status === 'scheduled' ? (
                    <Button className="w-full" size="sm" variant="outline" disabled>
                      Opens Soon
                    </Button>
                  ) : (
                    <Button className="w-full" size="sm" variant="outline" disabled>
                      Closed
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Live Watch Room */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Live Auction</h2>
          {room.status === 'live' && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {product?.totalBids ?? 0} bids
            </span>
          )}
        </div>

        {!selectedProductId ? (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No auction items in this room yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Live bidding will be available as soon as the seller adds a product to the room.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current bid + live bid list */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Current Bid
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(product?.currentBid ?? 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Ends In
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {productCountdown || '—'}
                    </p>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  <h3 className="text-sm font-semibold">Recent Bids</h3>
                  {liveBids.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      No bids yet — be the first to bid!
                    </p>
                  ) : (
                    liveBids.map((bid) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                          {bid.isAutoBid && (
                            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          <span className="truncate">{bid.bidderName || 'Bidder'}</span>
                        </span>
                        <span className="shrink-0 font-semibold">
                          {formatCurrency(bid.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Bid panel (desktop/tablet) */}
              <Card className="hidden p-5 md:block">
                <h3 className="mb-4 text-sm font-semibold">Place a Bid</h3>
                {room.status === 'live' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bid-amount" className="text-sm">
                        Your Bid (₦)
                      </Label>
                      <Input
                        id="bid-amount"
                        type="number"
                        min={0}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bid-max" className="text-sm">
                        Max Bid — auto-bid (optional)
                      </Label>
                      <Input
                        id="bid-max"
                        type="number"
                        min={0}
                        value={maxBid}
                        onChange={(e) => setMaxBid(e.target.value)}
                        placeholder="Set a maximum for auto-bidding"
                        className="mt-1.5"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave empty to place a single bid.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePlaceBid}
                      disabled={isPlacingBid || !bidAmount}
                    >
                      {isPlacingBid ? 'Placing bid...' : 'Place Bid'}
                    </Button>
                  </div>
                ) : room.status === 'scheduled' ? (
                  <p className="text-sm text-muted-foreground">
                    Bidding opens when the room goes live.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This auction has ended.
                  </p>
                )}
              </Card>
            </div>

            {/* Sticky bottom bid bar (mobile) */}
            {room.status === 'live' && (
              <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t bg-background px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Your bid (₦)"
                    className="h-11 flex-1"
                    aria-label="Bid amount"
                  />
                  <Button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount}
                    className="h-11 shrink-0"
                  >
                    {isPlacingBid ? 'Placing...' : 'Bid'}
                  </Button>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={maxBid}
                  onChange={(e) => setMaxBid(e.target.value)}
                  placeholder="Max bid (auto-bid, optional)"
                  className="mt-2 h-10"
                  aria-label="Maximum bid"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Room Assistant */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              AI Room Assistant
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                BETA
              </span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask about bidding rules, item details, deposit requirements, or how the room works.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'How does bidding work here?',
                'What items are in this room?',
                'Is a deposit required?',
                'When does the auction end?',
              ].map((question) => (
                <button
                  key={question}
                  className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-[11px] text-primary transition-all hover:bg-primary/10 hover:scale-105"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
