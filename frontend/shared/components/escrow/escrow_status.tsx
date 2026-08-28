'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Hold {
  id: string;
  invoiceId: string;
  amount: number;
  status: 'held' | 'disputed' | 'released' | 'refunded';
  refundReason?: string | null;
  releasedAt?: string | null;
}

const STATUS_STYLE: Record<Hold['status'], string> = {
  held: 'bg-blue-100 text-blue-800',
  disputed: 'bg-amber-100 text-amber-800',
  released: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-red-100 text-red-800',
};

/**
 * Escrow status (L5). Shows the funds-in-escrow lifecycle for an invoice.
 */
export function EscrowStatus({ invoiceId, token }: { invoiceId?: string; token?: string }) {
  const [holds, setHolds] = useState<Hold[]>([]);

  useEffect(() => {
    if (!invoiceId) return;
    fetch(API_BASE + '/escrow/holds/invoice/' + encodeURIComponent(invoiceId), {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setHolds(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setHolds([]));
  }, [invoiceId, token]);

  if (!invoiceId) return null;

  if (holds.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        No escrow hold yet for this invoice.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {holds.map((h) => (
        <li key={h.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <div>
            <p className="font-medium">Escrow hold</p>
            <p className="text-xs text-muted-foreground">
              {h.releasedAt ? 'Settled ' + new Date(h.releasedAt).toLocaleDateString() : 'Awaiting settlement'}
            </p>
            {h.refundReason && <p className="text-xs text-red-700">Refund: {h.refundReason}</p>}
          </div>
          <div className="text-right">
            <span className={'inline-block rounded-full px-2 py-0.5 text-xs font-semibold ' + (STATUS_STYLE[h.status] ?? '')} data-testid="escrow-status">
              {h.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default EscrowStatus;
