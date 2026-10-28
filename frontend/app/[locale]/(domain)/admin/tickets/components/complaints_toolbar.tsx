'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, Flag, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input } from '@/shared/components/common';
import { ApiError, apiFetch } from '@/shared/utils/api-client';
import type { Ticket } from '../../models';

interface SlaSummary {
  open: number;
  overdue: number;
  dueSoon: number;
  unresponded: number;
  dataProtectionOpen: number;
  dataProtectionOverdue: number;
}

interface FlaggedReview {
  id: string;
  rating: number;
  comment: string;
  flag_reason?: string | null;
  flagged_at?: string | null;
  seller_id?: string;
}

interface ComplaintsToolbarProps {
  /** The ticket in focus, so a remedy can credit the right account. */
  selectedTicket: Ticket | null;
}

/**
 * The operating half of the complaints workspace.
 *
 * The queue used to show conversations only: no idea whether service levels were
 * being met, no way to export the register the policy promises to review, no
 * access to reported reviews, and no remedy that did not need database access.
 * These four controls close that — each one calls an endpoint added for it.
 */
export default function ComplaintsToolbar({ selectedTicket }: ComplaintsToolbarProps) {
  const [summary, setSummary] = useState<SlaSummary | null>(null);
  const [flagged, setFlagged] = useState<FlaggedReview[]>([]);
  const [showFlagged, setShowFlagged] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [goodwillPolicy, setGoodwillPolicy] = useState<{
    enabled: boolean;
    maxAmount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const json = await apiFetch<{ data?: SlaSummary }>('tickets/sla/summary');
      setSummary(json?.data ?? null);
    } catch {
      setSummary(null);
    }
  }, []);

  const loadFlagged = useCallback(async () => {
    try {
      const json = await apiFetch<{ data?: FlaggedReview[] }>('admin/reviews/flagged');
      setFlagged(json?.data ?? []);
    } catch {
      setFlagged([]);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void loadFlagged();
    void apiFetch<{ data?: { enabled: boolean; maxAmount: number } }>(
      'admin/wallets/goodwill-policy',
    )
      .then((json) => setGoodwillPolicy(json?.data ?? null))
      .catch(() => setGoodwillPolicy(null));
  }, [loadSummary, loadFlagged]);

  const exportRegister = async () => {
    setBusy(true);
    try {
      const json = await apiFetch<{ csv?: string; filename?: string }>(
        'admin/complaints/register?format=csv',
      );
      if (!json?.csv) throw new Error('The register came back empty');
      // A blob download keeps this dependency-free and works in every browser.
      const url = URL.createObjectURL(new Blob([json.csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = json.filename || 'complaints.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Complaint register downloaded');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not export the register');
    } finally {
      setBusy(false);
    }
  };

  const decideReview = async (id: string, action: 'hide' | 'remove' | 'restore') => {
    setBusy(true);
    try {
      await apiFetch(`admin/reviews/${id}/decision`, { method: 'PATCH', body: { action } });
      toast.success(
        action === 'restore' ? 'Report rejected, review restored' : `Review ${action === 'hide' ? 'hidden' : 'removed'}`,
      );
      await loadFlagged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not record the decision');
    } finally {
      setBusy(false);
    }
  };

  const creditWallet = async () => {
    if (!selectedTicket?.userId) {
      toast.error('This complaint is not linked to an account, so it cannot be credited');
      return;
    }
    const amount = Number(creditAmount);
    if (goodwillPolicy && !goodwillPolicy.enabled) {
      toast.error('Goodwill credits are switched off in settings.');
      return;
    }
    if (goodwillPolicy && amount > goodwillPolicy.maxAmount) {
      toast.error(
        `The ceiling is ₦${goodwillPolicy.maxAmount.toLocaleString()} per credit. ` +
          'Raise it in settings, or handle it as a formal remedy.',
      );
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`admin/wallets/${encodeURIComponent(selectedTicket.userId)}/credit`, {
        method: 'POST',
        // A key per submission makes a double click one credit, not two.
        body: { amount, reason: creditReason, idempotencyKey: crypto.randomUUID() },
      });
      toast.success('Goodwill credit issued');
      setShowCredit(false);
      setCreditAmount('');
      setCreditReason('');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not issue the credit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4 space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {summary && (
          <>
            <Badge variant="secondary" className="font-normal">
              {summary.open} open
            </Badge>
            {summary.overdue > 0 && (
              <Badge className="border-red-200 bg-red-100 font-semibold text-red-700">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {summary.overdue} overdue
              </Badge>
            )}
            {summary.dueSoon > 0 && (
              <Badge className="border-amber-200 bg-amber-100 font-normal text-amber-700">
                {summary.dueSoon} due soon
              </Badge>
            )}
            {summary.unresponded > 0 && (
              <Badge variant="outline" className="font-normal">
                {summary.unresponded} awaiting first reply
              </Badge>
            )}
            {summary.dataProtectionOpen > 0 && (
              <Badge variant="outline" className="font-normal">
                {summary.dataProtectionOpen} data protection
                {summary.dataProtectionOverdue > 0 ? ` · ${summary.dataProtectionOverdue} past the statutory clock` : ''}
              </Badge>
            )}
          </>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFlagged((v) => !v)}>
            <Flag className="mr-1.5 h-4 w-4" />
            Reported reviews ({flagged.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedTicket}
            onClick={() => setShowCredit((v) => !v)}
            title={selectedTicket ? 'Issue a goodwill credit to this account' : 'Select a complaint first'}
          >
            <Wallet className="mr-1.5 h-4 w-4" />
            Goodwill credit
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void exportRegister()}>
            <Download className="mr-1.5 h-4 w-4" />
            Export register
          </Button>
        </div>
      </div>

      {showCredit && selectedTicket && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 p-3">
          {goodwillPolicy && !goodwillPolicy.enabled ? (
            <p className="text-sm text-muted-foreground">
              Goodwill credits are switched off. A super admin can enable them in
              Settings → Goodwill credits.
            </p>
          ) : (
            <>
              <div className="w-32">
                <label className="text-xs text-muted-foreground" htmlFor="credit-amount">
                  Amount (NGN)
                </label>
                <Input
                  id="credit-amount"
                  type="number"
                  min={1}
                  max={goodwillPolicy?.maxAmount}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              <div className="min-w-[240px] flex-1">
                <label className="text-xs text-muted-foreground" htmlFor="credit-reason">
                  Reason — it goes on the ledger (required)
                </label>
                <Input
                  id="credit-reason"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g. delivery delay apology"
                />
              </div>
              <Button
                size="sm"
                disabled={busy || !creditAmount || !creditReason.trim()}
                onClick={() => void creditWallet()}
              >
                Credit wallet
              </Button>
            </>
          )}
          {goodwillPolicy?.enabled && (
            <p className="w-full text-xs text-muted-foreground">
              Ceiling ₦{goodwillPolicy.maxAmount.toLocaleString()} per credit. Crediting a wallet
              needs a fresh second-factor code.
            </p>
          )}
        </div>
      )}

      {showFlagged && (
        <div className="space-y-2 rounded-lg border border-border/60 p-3">
          {flagged.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews have been reported.</p>
          ) : (
            flagged.map((review) => (
              <div key={review.id} className="flex flex-wrap items-start gap-3 border-b border-border/40 pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{review.rating}★</span> {review.comment}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reported: {review.flag_reason || 'no reason given'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void decideReview(review.id, 'hide')}>
                    Hide
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void decideReview(review.id, 'remove')}>
                    Remove
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void decideReview(review.id, 'restore')}>
                    Dismiss report
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
