'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Clock, Mail, Shield } from 'lucide-react';
import { Button, Card, Skeleton } from '@/shared/components/common';
import { ApiError, apiFetch } from '@/shared/utils/api-client';

/** Wire shape of GET /invites/received (backend/src/invites/invite.service.ts). */
interface PendingInvite {
  id: string;
  token: string;
  roomId: string;
  productId: string;
  mode: string;
  response: string;
  inviteeName?: string | null;
  inviteeEmail?: string | null;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
  room?: { id: string; name: string; startTime: string; endTime: string } | null;
  inviter?: { id: string; name: string } | null;
}

interface InvitationRow {
  id: string;
  token: string;
  roomName: string;
  inviter: string;
  expiresAt: string;
  createdAt: string;
  active: boolean;
  mode: string;
}

function toRow(invite: PendingInvite): InvitationRow {
  return {
    id: invite.id,
    token: invite.token,
    roomName: invite.room?.name || 'Private auction room',
    inviter: invite.inviter?.name || 'A GreyAuction seller',
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    active: invite.isActive,
    mode: invite.mode,
  };
}

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvitationsModule() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    // /invites/received is the caller's own invitations, matched on their
    // account email. This list used to be /invites/pending — invitations the
    // caller *sent* — and before that every private room on the platform.
    const json = await apiFetch<PendingInvite[] | { data?: PendingInvite[] }>(
      'invites/received'
    );
    const rows = Array.isArray(json) ? json : json.data ?? [];
    return rows.map(toRow);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    loadInvitations()
      .then((rows) => {
        if (cancelled) return;
        setInvitations(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setInvitations([]);
        setError(
          err instanceof ApiError
            ? err.message
            : 'Invitations could not be loaded right now.'
        );
      });
    return () => {
      cancelled = true;
    };
    // userId is a dependency so a session change refetches the right rows.
  }, [status, userId, loadInvitations]);

  const loading = invitations === null;

  if (status === 'unauthenticated') {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to see your invitations.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">My Invitations</h2>
        <p className="text-sm text-muted-foreground">
          Private auction rooms you have been invited to. Open an invitation to
          accept it and join the room.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      )}

      {invitations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Mail className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No Pending Invitations</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            When a seller invites you to a private room it will appear here, as
            well as in the email we send to your registered address.
          </p>
          <Button variant="outline" onClick={() => router.push('/auctions')}>
            Browse Public Auctions
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <Card key={inv.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <Shield className="h-3 w-3" />
                      {inv.mode === 'request' ? 'Awaiting seller approval' : 'Awaiting your response'}
                    </span>
                    {!inv.active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Room */}
                  <h3 className="text-lg font-bold line-clamp-1">
                    {inv.roomName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Invited by {inv.inviter}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Expires {formatDate(inv.expiresAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      Sent {formatDate(inv.createdAt)}
                    </span>
                  </div>
                </div>

                <Button
                  className="shrink-0"
                  onClick={() => router.push(`/invite/${inv.token}`)}
                >
                  Review invitation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
