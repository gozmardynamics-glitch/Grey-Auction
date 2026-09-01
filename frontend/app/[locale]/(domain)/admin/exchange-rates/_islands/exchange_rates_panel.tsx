'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppSelector } from '@/redux/store';
import { toast } from 'sonner';
import { RefreshCw, Save, X, SquarePen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/common/card';
import { Button } from '@/shared/components/common/button';
import { Input } from '@/shared/components/common/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/components/common/table';
import { Skeleton } from '@/shared/components/common/skeleton';
import { EmptyState } from '@/shared/components/common/empty_state';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ExchangeRatesView {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

function formatLastUpdated(iso: string | null | undefined, never: string): string {
  if (!iso) return never;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return never;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ExchangeRatesPanel() {
  const t = useTranslations('admin.exchangeRates');
  const token = useAppSelector((state) => state.auth.token);

  const [view, setView] = useState<ExchangeRatesView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Per-row editing state keyed by currency code.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/exchange-rates`, { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      setView({
        base: json?.data?.base || 'NGN',
        rates: json?.data?.rates || {},
        updatedAt: json?.data?.updatedAt ?? json?.data?.lastUpdated ?? null,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: fetch directly (no synchronous setState in the effect body —
  // state updates happen only in promise callbacks, satisfying
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/exchange-rates`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
      .then((json: { data?: { base?: string; rates?: Record<string, number>; updatedAt?: string | null; lastUpdated?: string | null } }) => {
        if (cancelled) return;
        setView({
          base: json?.data?.base || 'NGN',
          rates: json?.data?.rates || {},
          updatedAt: json?.data?.updatedAt ?? json?.data?.lastUpdated ?? null,
        });
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    fetchRates();
  };

  const rows = Object.entries(view?.rates ?? {});

  const beginEdit = (code: string) => {
    if (!view) return;
    const current = view.rates[code];
    setEditing(code);
    setDraft(String(current ?? ''));
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft('');
  };

  const handleSave = useCallback(async () => {
    if (!editing || !token) return;
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t('invalidRate'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/exchange-rates/${encodeURIComponent(editing)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ rate: value }),
      });
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      toast.success(t('saved', { code: editing }));
      // Reflect the updated rate + timestamp returned by the backend.
      setView((prev) => {
        if (!prev) return prev;
        const nextRates = { ...prev.rates, [editing]: value };
        const nextUpdatedAt = json?.data?.updatedAt ?? new Date().toISOString();
        return { ...prev, rates: nextRates, updatedAt: nextUpdatedAt };
      });
      setEditing(null);
      setDraft('');
    } catch {
      toast.error(t('saveFailed', { code: editing }));
    } finally {
      setSaving(false);
    }
  }, [draft, editing, token, t]);

  const handleRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/exchange-rates/refresh`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      const updated = Number(json?.updated ?? 0);
      if (updated > 0) {
        toast.success(t('refreshed', { count: updated }));
      } else {
        toast.info(t('noUpdates'));
      }
      await fetchRates();
    } catch {
      toast.error(t('refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  }, [token, t, fetchRates]);

  if (loading) {
    return (
      <div className="space-y-4" data-testid="exchange-rates-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<RefreshCw className="h-10 w-10" />}
        title={t('errorTitle')}
        description={t('errorDescription')}
        action={
          <Button variant="outline" onClick={retry}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing || !token}
        >
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {refreshing ? t('refreshing') : t('refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('baseCurrency')}</CardTitle>
          <CardDescription>{view?.base ?? 'NGN'}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              title={t('emptyTitle')}
              description={t('emptyDescription')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('code')}</TableHead>
                  <TableHead>{t('rate')}</TableHead>
                  <TableHead>{t('lastUpdated')}</TableHead>
                  <TableHead className="text-right">{/* actions */}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([code, rate]) => {
                  const isEditing = editing === code;
                  return (
                    <TableRow key={code} data-testid={`exchange-rate-row-${code}`}>
                      <TableCell className="font-medium">{code}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={draft}
                            aria-label={t('rate') + ' ' + code}
                            data-testid={`rate-input-${code}`}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="h-9 w-32"
                          />
                        ) : (
                          <span data-testid={`rate-value-${code}`}>
                            {Number(rate).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatLastUpdated(view?.updatedAt, t('never'))}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={saving}
                              data-testid={`save-${code}`}
                            >
                              <Save className="h-4 w-4" />
                              {saving ? t('saving') : t('save')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              aria-label={t('cancel')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => beginEdit(code)}
                            aria-label={t('edit') + ' ' + code}
                            data-testid={`edit-${code}`}
                          >
                            <SquarePen className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
