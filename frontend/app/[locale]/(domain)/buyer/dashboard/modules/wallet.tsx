'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ListFilter, Search } from 'lucide-react';

import { Button, Input, SortDropdown } from '@/shared/components/common';

import WalletBalanceCard from '../components/wallet/wallet_balance_card';
import WalletPaymentsTable from '../components/wallet/wallet_payments_table';
import { DUMMY_WALLET_PAYMENTS } from '../../models/data';

const DepositModal = dynamic(() => import('../components/wallet/deposit_modal'));
const WithdrawModal = dynamic(() => import('../components/wallet/withdraw_modal'));



export default function BuyerWalletModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('default');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const walletBalance = 20000000;

  // Mock: toggle to test both flows
  // Set to null to test the add-account flow, or provide an object for the has-account flow
  const mockBankAccount = null;
  const mockHasPin = false;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Wallet</h2>
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-[200px] h-9 bg-card"
          />
        </div>
      </div>

      {/* Balance Card */}
      <WalletBalanceCard
        balance={walletBalance}
        bankAccount={mockBankAccount}
        onWithdraw={() => setWithdrawOpen(true)}
        onDeposit={() => setDepositOpen(true)}
        onAddAccount={() => setWithdrawOpen(true)}
      />

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment History</h3>
          <div className="flex items-center gap-2">
            <SortDropdown value={sortValue} onValueChange={setSortValue} />
            <Button variant="outline" size="sm" className="bg-card">
              <ListFilter className="h-4 w-4" />
              Filter
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
        bankAccount={mockBankAccount}
        hasPin={mockHasPin}
      />
    </div>
  );
}
