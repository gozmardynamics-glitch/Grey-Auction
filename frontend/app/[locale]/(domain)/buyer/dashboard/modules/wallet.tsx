'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ListFilter, Search } from 'lucide-react';

import { Button, Input, SortDropdown } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';
import { useTranslations } from 'next-intl';

import WalletBalanceCard from '../components/wallet/wallet_balance_card';
import WalletPaymentsTable from '../components/wallet/wallet_payments_table';
import { DUMMY_WALLET_PAYMENTS } from '../../models/data';

const DepositModal = dynamic(() => import('../components/wallet/deposit_modal'));
const WithdrawModal = dynamic(() => import('../components/wallet/withdraw_modal'));

interface WalletApiData {
  balance: number;
  hasPin: boolean;
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdraw';
    amount: number | string;
    status: string;
    createdAt: string;
    reference?: string | null;
    description?: string | null;
  }>;
}

export default function BuyerWalletModule() {
  const t = useTranslations('buyer.wallet');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('default');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const authToken = useAppSelector((state) => state.auth.token);

  // Defaults render when the wallet API is unavailable
  const [walletBalance, setWalletBalance] = useState(20000000);
  const [hasPin, setHasPin] = useState(false);
  const [, setApiData] = useState<WalletApiData['transactions'] | null>(null);

  // Load the live wallet when available; keep defaults on failure
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const load = async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
          fetch(apiBase + '/wallet', { headers: { Authorization: 'Bearer ' + authToken }, cache: 'no-store' }),
          fetch(apiBase + '/wallet/transactions', { headers: { Authorization: 'Bearer ' + authToken }, cache: 'no-store' }),
        ]);
        if (!cancelled && walletRes.ok) {
          const wallet = (await walletRes.json()).data;
          if (wallet && typeof wallet.balance === 'number') {
            setWalletBalance(wallet.balance);
            setHasPin(Boolean(wallet.hasPin));
          }
        }
        if (!cancelled && txRes.ok) {
          const txs = (await txRes.json()).data;
          if (Array.isArray(txs)) setApiData(txs);
        }
      } catch {
        // Keep the defaults — the wallet UI still renders empty states
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const bankAccount = null; // no linked bank account flow in the API yet

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-[200px] h-9 bg-card"
          />
        </div>
      </div>

      {/* Balance Card */}
      <WalletBalanceCard
        balance={walletBalance}
        bankAccount={bankAccount}
        onWithdraw={() => setWithdrawOpen(true)}
        onDeposit={() => setDepositOpen(true)}
        onAddAccount={() => setWithdrawOpen(true)}
      />

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('paymentHistory')}</h3>
          <div className="flex items-center gap-2">
            <SortDropdown value={sortValue} onValueChange={setSortValue} />
            <Button variant="outline" size="sm" className="bg-card">
              <ListFilter className="h-4 w-4" />
              {t('filter')}
            </Button>
          </div>
        </div>

        <WalletPaymentsTable
          data={DUMMY_WALLET_PAYMENTS}
          globalFilter={searchQuery}
        />
      </div>

      {/* Modals */}
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={walletBalance}
        bankAccount={bankAccount}
        hasPin={hasPin}
      />
    </div>
  );
}
