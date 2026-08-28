'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge, Button, Card } from '@/shared/components/common';
import { DisputeDialog } from './dispute_dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DisputeRow {
  id: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  productId?: string | null;
  createdAt: string;
  resolution?: string | null;
  feedback?: { id: string; userId: string; rating: number; comment?: string | null }[];
}

const STATUS_STYLE: Record<DisputeRow['status'], string> = {
  open: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const REASON_LABEL: Record<string, string> = {
  not_as_described: 'Not as described',
  non_delivery: 'Non-delivery',
  payment_issue: 'Payment issue',
  conduct: 'Seller conduct',
  other: 'Other',
};

/**
 * Buyer "Disputes" dashboard module (L4): lists my disputes and lets me open
 * a new one.
 */
export function MyDisputes({ token }: { token?: string }) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(API_BASE + '/disputes', {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDisputes(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Disputes &amp; resolutions</h3>
          <p className="text-sm text-muted-foreground">
            Raise a case about a purchase and track its resolution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} aria-label="Refresh disputes">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} data-testid="open-dispute">
            Open dispute
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading disputes...</p>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No disputes. We hope it stays that way.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {disputes.map((d) => (
            <li key={d.id} className="space-y-1 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{REASON_LABEL[d.reason] ?? d.reason}</span>
                <Badge variant="outline" className={'text-xs ' + (STATUS_STYLE[d.status] ?? '')}>
                  {d.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{d.description}</p>
              {d.resolution && (
                <p className="text-xs text-emerald-700">Resolution: {d.resolution}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <DisputeDialog open={open} onClose={() => setOpen(false)} onOpened={load} token={token} />
    </Card>
  );
}

export default MyDisputes;
