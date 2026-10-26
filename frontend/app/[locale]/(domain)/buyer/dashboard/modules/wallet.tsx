'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ListFilter, Search } from 'lucide-react';

import { Button, Input, SortDropdown } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

import WalletBalanceCard from '../components/wallet/wallet_balance_card';
import WalletPaymentsTable from '../components/wallet/wallet_payments_table';
import type { WalletPayment } from '../../models';
import { apiFetch } from '@/shared/utils/api-client';
import { useSession } from 'next-auth/react';

interface BankAccountInfo {
  name: string;
  bankName: string;
  maskedAccount: string;
}

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
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Honest start: ₦0 until the API answers. No demo balance.
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [transactions, setTransactions] = useState<WalletPayment[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // The payout account lives on the seller profile; withdrawals need it.
  const [bankAccount, setBankAccount] = useState<BankAccountInfo | null>(null);

  // Load the live wallet when available
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [walletJson, txJson, profileJson] = await Promise.all([
          apiFetch<{ data: { balance: number; hasPin: boolean } }>('wallet'),
          apiFetch<{ data: WalletApiData['transactions'] }>('wallet/transactions'),
          // 404s for an account with no seller profile — treated as "no account".
          apiFetch<{ data?: { bank_account_details?: { bank_name?: string; account_number?: string; account_name?: string } | null } }>(
            'sellers/profile/me',
          ).catch(() => null),
        ]);
        if (cancelled) return;
        const wallet = walletJson.data;
        if (wallet && typeof wallet.balance === 'number') {
          setWalletBalance(Number(wallet.balance));
          setHasPin(Boolean(wallet.hasPin));
        }
        const details = profileJson?.data?.bank_account_details;
        setBankAccount(
          details?.account_number
            ? {
                name: details.account_name || 'Payout account',
                bankName: details.bank_name || 'Bank account',
                maskedAccount: '••••' + details.account_number.slice(-4),
              }
            : null,
        );
        const txs = txJson.data;
        if (Array.isArray(txs)) {
          setTransactions(
            txs.map((tx) => ({
              referenceId: tx.reference || tx.id,
              paymentName: tx.description || (tx.type === 'deposit' ? 'Wallet top-up' : 'Withdrawal'),
              type: tx.type === 'deposit' ? 'Deposit' : 'Withdraw',
              method: 'Wallet',
              amount: Number(tx.amount),
              date: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : '—',
              status:
                tx.status === 'completed' ? 'Completed' :
                tx.status === 'pending' ? 'Pending' :
                tx.status === 'failed' ? 'Failed' : 'Completed',
            })),
          );
        }
      } catch {
        // Leave the honest zero/empty state — the UI renders empty tables.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshKey]);

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
          data={transactions}
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
        onWithdrawn={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
