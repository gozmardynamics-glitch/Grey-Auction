'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/shared/utils/api-client';

import SellerBalanceCard from '../payment/components/seller_balance_card';
import { useSellerWallet } from '@/lib/hooks/wallet.hooks';
import { Payment } from '../../admin/models';

const WithdrawModal = dynamic(() => import('../payment/components/withdraw_modal'));
const AddAccountModal = dynamic(
  () => import('@/shared/components/add_account_steps/add_account_modal')
);

interface PaymentActionsProps {
  payments: Payment[];
}

export default function PaymentActions({ payments: _payments }: PaymentActionsProps) {
  const sellerWallet = useSellerWallet();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  // The wallet ledger is the authority on what a seller can withdraw: escrow
  // release credits sellerNet there, and an in-flight payout is already
  // debited. Deriving a balance from a status string read ₦0 forever.
  const [currentBalance, setCurrentBalance] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBalance = useCallback(async () => {
    try {
      const json = await apiFetch<{ data?: { balance?: number } }>('wallet');
      setCurrentBalance(Number(json?.data?.balance ?? 0));
    } catch {
      setCurrentBalance(0);
    }
  }, []);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance, refreshKey]);

  return (
    <>
      <SellerBalanceCard
        balance={currentBalance}
        hasPaymentMethod={sellerWallet.bankAccounts.length > 0}
        onWithdraw={() => setWithdrawOpen(true)}
        onAddAccount={() => setAddAccountOpen(true)}
      />

      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={(open) => {
          setWithdrawOpen(open);
          if (!open) setRefreshKey((k) => k + 1);
        }}
        availableBalance={currentBalance}
        onPayoutRequested={() => setRefreshKey((k) => k + 1)}
      />

      <AddAccountModal open={addAccountOpen} onOpenChange={setAddAccountOpen} />
    </>
  );
}
