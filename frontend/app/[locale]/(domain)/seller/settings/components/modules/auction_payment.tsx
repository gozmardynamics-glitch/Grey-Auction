'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';

interface AuctionPaymentSettings {
  invoice_payment_due_days: number;
  require_minimum_bid_deposit: boolean;
  minimum_bid_deposit: number | null;
}

export default function AuctionPaymentSettings() {
  const token = useAppSelector((state) => state.auth.token);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const [days, setDays] = useState(7);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [minDeposit, setMinDeposit] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(apiBase + '/seller/profile/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const json = await res.json();
          const p = json?.data ?? json;
          setDays(p?.invoice_payment_due_days ?? 7);
          setRequireDeposit(Boolean(p?.require_minimum_bid_deposit));
          setMinDeposit(p?.minimum_bid_deposit != null ? String(p.minimum_bid_deposit) : '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, apiBase]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(apiBase + '/seller/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          invoice_payment_due_days: Number(days) || 7,
          require_minimum_bid_deposit: requireDeposit,
          minimum_bid_deposit: requireDeposit && minDeposit ? Number(minDeposit) : null,
        }),
      });
      if (res.ok) {
        setMessage('Saved. Payment timeline and bid-deposit rules updated.');
      } else {
        setMessage('Failed to save settings. Please try again.');
      }
    } catch {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-base font-semibold mb-1">Auction Payment Settings</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Control how long a winning buyer has to pay, and whether a minimum wallet
        deposit is required before a bidder can bid on your auctions.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invoice payment timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium" htmlFor="due-days">
              Days a winning buyer has to pay the invoice
            </label>
            <input
              id="due-days"
              type="number"
              min={0}
              value={days}
              disabled={loading}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Require minimum wallet deposit to bid</p>
              <p className="text-xs text-muted-foreground">
                Bidders must fund their wallet to at least the amount below before they can bid.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireDeposit}
              onChange={(e) => setRequireDeposit(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          {requireDeposit && (
            <div>
              <label className="text-sm font-medium" htmlFor="min-deposit">
                Minimum wallet deposit (NGN)
              </label>
              <input
                id="min-deposit"
                type="number"
                min={0}
                value={minDeposit}
                placeholder="e.g. 5000"
                onChange={(e) => setMinDeposit(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}

          {message && <p className="text-xs text-muted-foreground">{message}</p>}

          <Button onClick={save} disabled={loading || saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
