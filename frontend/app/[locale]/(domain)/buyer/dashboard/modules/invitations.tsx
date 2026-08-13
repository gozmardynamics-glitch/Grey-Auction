'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Clock,
  Users,
  Shield,
  CheckCircle2,
  ArrowRight,
  Mail,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Button, Card, Skeleton } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';

interface Invitation {
  id: string;
  token: string;
  roomId: string;
  productId: string;
  roomName: string;
  roomDescription?: string;
  startTime: string;
  endTime: string;
  type: 'public' | 'private';
  requiresDeposit: boolean;
  depositAmount?: number;
  status: 'scheduled' | 'live' | 'closed';
  expiresAt: string;
  invitedByName?: string;
  participantCount: number;
}

export default function InvitationsModule() {
  const router = useRouter();
  const authToken = useAppSelector((state) => state.auth.token);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      // Fetch rooms where user is invited
      const res = await fetch(`${apiBase}/rooms`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load invitations');
      const json = await res.json();
      const rooms = json.data ?? json.data ?? [];
      // Filter to private rooms where user is in invited list
      // (In production this should be a dedicated endpoint)
      const invited = rooms
        .filter((room: any) => room.type === 'private')
        .map((room: any) => ({
          id: room.id,
          token: '',
          roomId: room.id,
          productId: room.productIds?.[0] || '',
          roomName: room.name,
          roomDescription: room.description,
          startTime: room.startTime,
          endTime: room.endTime,
          type: room.type,
          requiresDeposit: room.requiresDeposit,
          depositAmount: room.depositAmount,
          status: room.status,
          expiresAt: room.endTime,
          participantCount: 0,
        }));
      setInvitations(invited);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleJoinRoom = useCallback(
    async (roomId: string) => {
      setJoiningRoomId(roomId);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/rooms/${roomId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error('Failed to join room');
        router.push(`/room/${roomId}`);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setJoiningRoomId(null);
      }
    },
    [authToken, router]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">My Invitations</h2>
        <p className="text-sm text-muted-foreground">
          Private auction rooms you&apos;ve been invited to join
        </p>
      </div>

      {invitations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Mail className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No Invitations Yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            When a seller invites you to a private auction, it will appear here.
          </p>
          <Button variant="outline" onClick={() => router.push('/auctions')}>
            Browse Public Auctions
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const isLive = inv.status === 'live';
            const isClosed = inv.status === 'closed';
            return (
              <Card key={inv.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        <Lock className="h-3 w-3" />
                        Private
                      </span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                          Live Now
                        </span>
                      )}
                      {inv.requiresDeposit && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Shield className="h-3 w-3" />
                          Deposit Required
                        </span>
                      )}
                    </div>

                    {/* Room name */}
                    <h3 className="text-lg font-bold line-clamp-1">{inv.roomName}</h3>
                    {inv.roomDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {inv.roomDescription}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(inv.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        —{' '}
                        {new Date(inv.endTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {inv.participantCount} participants
                      </span>
                      {inv.invitedByName && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          Invited by {inv.invitedByName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {isClosed ? (
                      <Button variant="outline" size="sm" disabled>
                        Ended
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleJoinRoom(inv.roomId)}
                        disabled={joiningRoomId === inv.roomId}
                      >
                        {isLive ? 'Enter Live Room' : 'View Room'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
