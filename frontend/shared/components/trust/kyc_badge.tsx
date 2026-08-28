'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type KycBadgeTier = 'unverified' | 'pending' | 'verified' | 'trusted';

interface KycBadgeView {
  sellerId: string;
  businessName: string;
  badge: KycBadgeTier;
  verificationStatus: string;
  approvedDocuments: number;
  rating: number;
  totalSales: number;
  memberSince: string | null;
}

const TIER: Record<KycBadgeTier, { label: string; className: string }> = {
  trusted: { label: 'Verified & Trusted', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  verified: { label: 'Verified Seller', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  pending: { label: 'Verification Pending', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  unverified: { label: 'Unverified', className: 'bg-muted text-muted-foreground border-border' },
};

/**
 * Public trust signal (L4). Fetches the seller's KYC badge from the backend
 * and renders a compact, non-sensitive badge. Falls back to a neutral pill
 * when the API is unreachable or the seller has no badge.
 */
export function KycBadge({ sellerId, name }: { sellerId?: string; name?: string }) {
  const [view, setView] = useState<KycBadgeView | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    fetch(API_BASE + '/sellers/' + encodeURIComponent(sellerId) + '/kyc-badge', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) setView(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (!view) {
    return (
      <span data-testid="kyc-badge" className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {name ? <span className="font-semibold text-foreground">{name}</span> : null}
        Seller
      </span>
    );
  }

  const t = TIER[view.badge] ?? TIER.unverified;
  return (
    <span data-testid="kyc-badge" className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ' + t.className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.label}
    </span>
  );
}

export default KycBadge;
