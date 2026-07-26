'use client';

import { Wallet, Plus } from 'lucide-react';
import { Button, Card } from '@/shared/components/common';

interface SellerBalanceCardProps {
  balance: number;
  hasPaymentMethod?: boolean;
  onWithdraw: () => void;
  onAddAccount: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

export default function SellerBalanceCard({
  balance,
  hasPaymentMethod = false,
  onWithdraw,
  onAddAccount,
}: SellerBalanceCardProps) {
  return (
    <Card className="overflow-hidden bg-background p-6 space-y-4">
      {/* Payment Method Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {hasPaymentMethod ? 'Payment Method Active' : 'No Payment Method yet'}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onAddAccount}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Balance + Withdraw Row */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-semibold">{formatCurrency(balance)}</p>
        </div>
        <Button className="gap-2" onClick={onWithdraw}>
          <Wallet className="h-4 w-4" />
          Withdraw
        </Button>
      </div>
    </Card>
  );
}
