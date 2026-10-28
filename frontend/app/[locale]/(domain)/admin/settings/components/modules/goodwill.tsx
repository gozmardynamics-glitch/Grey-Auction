'use client';

import { useCallback, useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, Button, Input, Switch } from '@/shared/components/common';
import { ApiError, apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

interface GoodwillPolicy {
  enabled: boolean;
  maxAmount: number;
  maxAmountIsDefault: boolean;
}

/**
 * The goodwill credit policy.
 *
 * A goodwill credit puts real money in a customer's wallet with no escrow and no
 * invoice behind it, so it is a discretionary remedy that needs a boundary: the
 * platform decides whether it exists at all, and how large a single credit may
 * be. There is no "unlimited" setting — that is how a remedy becomes a leak.
 */
export default function GoodwillSettings() {
  const token = useAppSelector((state) => state.auth.token);
  const [policy, setPolicy] = useState<GoodwillPolicy | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ data: GoodwillPolicy }>('admin/wallets/goodwill-policy', {
        token,
      });
      setPolicy(res.data);
      setEnabled(res.data.enabled);
      setMaxAmount(res.data.maxAmount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the goodwill policy.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const ceiling = Number(maxAmount);
    if (!(ceiling > 0)) {
      toast.error('Set a ceiling above zero — an unlimited credit is not an option.');
      return;
    }
    setIsSaving(true);
    try {
      await apiFetch('settings/goodwill', {
        method: 'PUT',
        token,
        body: { section: 'goodwill', enabled, maxAmount: ceiling },
      });
      toast.success('Goodwill policy saved');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the policy');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading goodwill policy…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Goodwill credits</h3>
        <Badge variant={policy?.enabled ? 'default' : 'secondary'}>
          {policy?.enabled ? 'Available' : 'Switched off'}
        </Badge>
      </div>

      <p className="max-w-3xl text-sm text-muted-foreground">
        A goodwill credit is the remedy for a complaint where no escrow hold is involved — a fee
        overcharged, a delivery that failed, a promise not kept. It is paid into the customer&apos;s
        wallet from the platform&apos;s own money, so it needs a reason, an administrator with a
        fresh second-factor proof, and a ceiling.
      </p>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Allow goodwill credits</p>
          <p className="text-xs text-muted-foreground">
            Switched off, the credit form refuses and the API rejects every credit. Existing credits
            are untouched.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="goodwill-ceiling" className="text-sm font-medium">
            Maximum per credit (₦)
          </label>
          <Input
            id="goodwill-ceiling"
            type="number"
            min={1}
            className="max-w-xs"
            value={maxAmount}
            onChange={(event) =>
              setMaxAmount(event.target.value === '' ? '' : Number(event.target.value))
            }
          />
          <p className="text-xs text-muted-foreground">
            Applied per credit, before the ledger entry is written. Anything above it is refused with
            the ceiling in the message, so the handler knows what to do instead.
            {policy?.maxAmountIsDefault
              ? ' This is the platform default — set your own if you want a different limit.'
              : ''}
          </p>
        </div>
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save policy'}
        </Button>
      </div>
    </div>
  );
}
