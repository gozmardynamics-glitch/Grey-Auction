'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Clock,
  Gavel,
  Users,
  MapPin,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, Skeleton } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useAppSelector } from '@/redux/store';

interface InviteData {
  token: string;
  room: {
    id: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: 'public' | 'private';
    requiresDeposit: boolean;
    depositAmount?: number;
    status: string;
  };
  product?: {
    id: string;
    title: string;
    currentBid: number;
    imageUrl?: string;
  };
  expiresAt: string;
  usageCount: number;
  maxUsage: number;
  mode?: 'exclusive' | 'request';
  response?: 'pending' | 'accepted' | 'declined';
}

export default function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: inviteToken } = use(params);
  const router = useRouter();
  const isLoggedIn = useAppSelector((state) => state.auth.isAuthenticated);
  const authName = useAppSelector((state) => state.auth.user?.name);
  const authEmail = useAppSelector((state) => state.auth.user?.email);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const loadInvite = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/invites/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid or expired invitation');
      }
      const json = await res.json();
      setInvite(json.data ?? json);
    } catch (err: any) {
      setError(err.message || 'This invitation is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleJoin = useCallback(async () => {
    if (!invite) return;
    setJoining(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/rooms/${invite.room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: invite.token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to join room');
      }
      // Record acceptance
      await fetch(`${apiBase}/invites/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invite.token, response: 'accepted' }),
      }).catch(() => {});
      setJoined(true);
      setTimeout(() => {
        router.push(`/room/${invite.room.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      setJoining(false);
    }
  }, [invite, router]);

  const handleRequestAccess = useCallback(async () => {
    if (!invite) return;
    setRequesting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(apiBase + '/invites/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invite.token,
          name: authName || undefined,
          email: authEmail || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Request failed');
      }
      setRequested(true);
    } catch (err: any) {
      setError(err.message || 'Could not submit your request');
    } finally {
      setRequesting(false);
    }
  }, [invite, authName, authEmail]);

  const handleDecline = useCallback(async () => {
    if (!invite) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/invites/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invite.token, response: 'declined' }),
      }).catch(() => {});
      router.push('/auctions');
    } catch {
      router.push('/auctions');
    }
  }, [invite, router]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (error || !invite) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Invitation Unavailable</h1>
          <p className="mb-6 text-muted-foreground">{error || 'This invitation is invalid or has expired.'}</p>
          <Button onClick={() => router.push('/auctions')}>
            Browse Public Auctions
          </Button>
        </Card>
      </div>
    );
  }

  // Joined state
  if (joined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Welcome to the Room!</h1>
          <p className="mb-6 text-muted-foreground">
            You have successfully joined {invite.room.name}. Redirecting to your invitations...
          </p>
        </Card>
      </div>
    );
  }

  const startsSoon = new Date(invite.room.startTime).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Exclusive Banner */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Exclusive Private Auction Invitation
        </div>
        <h1 className="text-3xl font-bold tracking-tight">You&apos;ve Been Invited</h1>
        <p className="mt-2 text-muted-foreground">
          A seller has personally selected you to participate in a private bidding room.
        </p>
      </div>

      {/* Room Card */}
      <Card className="overflow-hidden">
        {/* Room header */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{invite.room.name}</h2>
              {invite.room.description && (
                <p className="mt-1 text-sm text-muted-foreground">{invite.room.description}</p>
              )}
            </div>
            <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Private
            </div>
          </div>
        </div>

        {/* Room details */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Starts</p>
              <p className="font-medium">
                {new Date(invite.room.startTime).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gavel className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Ends</p>
              <p className="font-medium">
                {new Date(invite.room.endTime).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          {invite.room.requiresDeposit && (
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Deposit Required</p>
                <p className="font-medium">{formatCurrency(invite.room.depositAmount || 0)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Access</p>
              <p className="font-medium">Invitation only</p>
            </div>
          </div>
        </div>

        {/* Item preview */}
        {invite.product && (
          <div className="border-t border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Featured Item
            </p>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {invite.product.imageUrl && (
                  <img
                    src={invite.product.imageUrl}
                    alt={invite.product.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{invite.product.title}</p>
                {invite.product.currentBid > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Current bid: {formatCurrency(invite.product.currentBid)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-border bg-muted/30 p-6">
          {startsSoon && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <Clock className="mr-1.5 inline h-4 w-4" />
              This auction starts soon — join now to secure your spot.
            </div>
          )}
          {isLoggedIn ? (
            invite.mode === 'request' &&
            invite.response !== 'accepted' ? (
              <div className="space-y-2">
                {requested || invite.response === 'pending' ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <Shield className="mr-1.5 inline h-4 w-4" />
                    Request submitted — the seller will approve your access.
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleRequestAccess}
                    disabled={requesting}
                  >
                    {requesting ? 'Submitting...' : 'Request Access'}
                    {!requesting && <ArrowRight className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            ) : (
            <div className="space-y-2">
              <Button className="w-full gap-2" size="lg" onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Accept Invitation'}
                {!joining && <ArrowRight className="h-4 w-4" />}
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={handleDecline}
                disabled={joining}
              >
                Decline
              </Button>
            </div>
            )
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push(`/auth/login?redirect=/invite/${invite.token}`)}
              >
                Sign In to Accept
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                New to Grey Auction?{' '}
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => router.push(`/auth/buyer/register?redirect=/invite/${invite.token}`)}
                >
                  Create a buyer account
                </button>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Exclusivity notes */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 p-4 text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-primary" />
          <p className="text-xs font-semibold">Invite Only</p>
          <p className="text-[11px] text-muted-foreground">Only invited bidders can participate</p>
        </div>
        <div className="rounded-lg border border-border/50 p-4 text-center">
          <Shield className="mx-auto mb-2 h-5 w-5 text-primary" />
          <p className="text-xs font-semibold">Secure Bidding</p>
          <p className="text-[11px] text-muted-foreground">Protected and monitored transactions</p>
        </div>
        <div className="rounded-lg border border-border/50 p-4 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
          <p className="text-xs font-semibold">Exclusive Access</p>
          <p className="text-[11px] text-muted-foreground">Premium items for selected bidders</p>
        </div>
      </div>
    </div>
  );
}
