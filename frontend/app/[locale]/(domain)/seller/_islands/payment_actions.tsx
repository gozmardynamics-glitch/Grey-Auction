'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

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

export default function PaymentActions({ payments }: PaymentActionsProps) {
  const sellerWallet = useSellerWallet();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const currentBalance = payments.filter(
    (p) => p.status === 'Completed'
  ).reduce((sum, p) => sum + p.amount, 0);

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
        onOpenChange={setWithdrawOpen}
        availableBalance={currentBalance}
      />

      <AddAccountModal open={addAccountOpen} onOpenChange={setAddAccountOpen} />
    </>
  );
}
