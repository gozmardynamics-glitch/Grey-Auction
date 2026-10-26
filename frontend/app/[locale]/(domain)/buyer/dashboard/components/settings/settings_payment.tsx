'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Landmark } from 'lucide-react';

import {
  Badge,
  EmptyState,
  Separator,
  Skeleton,
} from '@/shared/components/common';

import { apiFetch } from '@/shared/utils/api-client';

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface SellerProfileResponse {
  success: boolean;
  data: {
    id: string;
    bank_account_details?: {
      bank_name?: string;
      account_number?: string;
      account_name?: string;
    } | null;
  };
}

export default function SettingsPayment() {
  const t = useTranslations('buyer.settings.payment');
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  // The API stores ONE payout account per account holder
  // (sellers.bank_account_details); there is no account list to edit here.
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const json = await apiFetch<SellerProfileResponse>('sellers/profile/me');
        if (cancelled) return;
        const details = json.data?.bank_account_details;
        setAccount(
          details?.account_number
            ? {
                bankName: details.bank_name || 'Bank account',
                accountName: details.account_name || '',
                accountNumber: details.account_number,
                isDefault: true,
              }
            : null
        );
      } catch {
        // Not a seller account yet, or the profile is unreadable — say so
        // rather than showing somebody else's bank details.
        if (!cancelled) setAccount(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const maskAccount = (num: string) => '••••••' + num.slice(-4);

  if (!loaded) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-[74px] w-full rounded-lg" />
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        icon={<Landmark className="h-12 w-12" />}
        title={t('emptyTitle')}
        description="Your payout account appears here once it is set up. Add one from the withdraw flow in your wallet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Landmark className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{account.bankName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {account.accountName} &middot; {maskAccount(account.accountNumber)}
            </p>
          </div>
          {account.isDefault && (
            <Badge
              variant="outline"
              className="shrink-0 text-primary border-primary"
            >
              {t('default')}
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {t('accountName')}
          </span>
          <span className="text-sm font-medium">
            {account.accountName || '—'}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {t('accountNumber')}
          </span>
          <span className="text-sm font-medium">{account.accountNumber}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">{t('status')}</span>
          <span className="text-sm">
            <Badge variant="outline" className="text-primary border-primary">
              {t('default')}
            </Badge>
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Payout accounts are managed from your wallet&apos;s withdraw flow.
      </p>
    </div>
  );
}
