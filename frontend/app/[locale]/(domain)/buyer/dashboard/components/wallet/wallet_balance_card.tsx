import { BanknoteArrowDown, BanknoteArrowUp, Wallet, Wallet2 } from 'lucide-react';
import { Badge, Button, Card } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useTranslations } from 'next-intl';
import { BankAccountInfo } from '../../../models';


interface WalletBalanceCardProps {
  balance: number;
  bankAccount?: BankAccountInfo | null;
  onWithdraw: () => void;
  onDeposit: () => void;
  onAddAccount?: () => void;
}

export default function WalletBalanceCard({
  balance,
  bankAccount,
  onWithdraw,
  onDeposit,
  onAddAccount,
}: WalletBalanceCardProps) {
  const t = useTranslations('buyer.wallet');

  return (
    <Card className="overflow-hidden bg-card p-6 space-y-4">
      {/* Top Row: Wallet icon + label | Bank info badge or Add Account */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {t('balance.available')}
          </span>
        </div>
        {bankAccount ? (
          <Badge variant="outline" className="text-xs font-medium">
            {bankAccount.bankName}: {bankAccount.maskedAccount}
          </Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={onAddAccount}>
            <Wallet2/>{t('balance.addAccount')}
          </Button>
        )}
      </div>

      {/* Bottom Row: Balance amount | Withdraw + Deposit buttons */}
      <div className="flex items-end justify-between">
        <p className="text-3xl font-semibold">{formatCurrency(balance)}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={onWithdraw}>
            <BanknoteArrowDown />{t('balance.withdraw')}
          </Button>
          <Button className="gap-2" onClick={onDeposit}>
            <BanknoteArrowUp />{t('balance.deposit')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
