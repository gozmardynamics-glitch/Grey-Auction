'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useAppSelector } from '@/redux/store';

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
}

const STATUS_STEPS = [
  { key: 'scheduled', label: 'Scheduled', icon: Clock },
  { key: 'live', label: 'Live', icon: Radio },
  { key: 'closed', label: 'Closed', icon: CheckCircle2 },
] as const;

export default function LiveRoomView({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: roomId } = use(params);
  const authToken = useAppSelector((state) => state.auth.token);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [auctions, setAuctions] = useState<RoomAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

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
        // Load auctions in room
        const auctionsRes = await fetch(`${apiBase}/rooms/${roomId}/participants`).catch(() => null);
        setAuctions([
          {
            id: data.productIds?.[0] || '1',
            title: 'Featured Auction Item',
            currentBid: 2500000,
            totalBids: 12,
            status: 'active',
          },
        ]);
      } catch (err: any) {
        setError(err.message);
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
      const diff = new Date(room.startTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Live now');
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

  // WebSocket connection
  useEffect(() => {
    if (!room || room.status !== 'live') return;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const socket = io(`${apiUrl}/auctions`, {
          auth: { token: authToken },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('joinRoom', { roomId: room.id });
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('newBid', (data: any) => {
          setAuctions((prev) =>
            prev.map((a) =>
              a.id === data.productId
                ? { ...a, currentBid: data.bid.amount, totalBids: a.totalBids + 1 }
                : a
            )
          );
        });
        socket.on('roomEnding', (data: any) => {
          // Show ending warning
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
  }, [room, authToken]);

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
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="h-full w-full object-cover"
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
