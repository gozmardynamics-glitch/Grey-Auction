'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Landmark, Plus, ChevronRight } from 'lucide-react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Separator,
} from '@/shared/components/common';

const AddAccountModal = dynamic(
  () => import('@/shared/components/add_account_steps/add_account_modal')
);

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  addedOn: string;
  isDefault: boolean;
}

const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    bankName: 'Wema Bank Plc',
    accountName: 'JAYDEN NICHOLAS',
    accountNumber: '0123456789',
    addedOn: '21 January, 2026',
    isDefault: true,
  },
];

export default function SettingsPayment() {
  const t = useTranslations('buyer.settings.payment');
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const maskAccount = (num: string) =>
    '••••••' + num.slice(-4);

  const handleSetDefault = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    setSelectedAccount((prev) =>
      prev ? { ...prev, isDefault: prev.id === id } : prev
    );
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDetailsOpen(false);
    setSelectedAccount(null);
  };

  const handleAddSuccess = () => {
    const newAccount: BankAccount = {
      id: String(Date.now()),
      bankName: 'Wema Bank Plc',
      accountName: 'JAYDEN NICHOLAS',
      accountNumber: '1234567890',
      addedOn: '25 January, 2026',
      isDefault: accounts.length === 0,
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const openDetails = (account: BankAccount) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  };

  if (accounts.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Landmark className="h-12 w-12" />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button onClick={() => setAddAccountOpen(true)}>
              <Plus className="size-4 mr-1" />
              {t('addBankAccount')}
            </Button>
          }
        />

        <AddAccountModal
          open={addAccountOpen}
          onOpenChange={setAddAccountOpen}
          onSuccess={handleAddSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Existing accounts */}
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => openDetails(account)}
            className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Landmark className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {account.bankName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {account.accountName} &middot; {maskAccount(account.accountNumber)}
              </p>
            </div>
            {account.isDefault && (
              <Badge variant="outline" className="shrink-0 text-primary border-primary">
                {t('default')}
              </Badge>
            )}
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}

        {/* Add Account card */}
        <button
          onClick={() => setAddAccountOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="size-4" />
          {t('addBankAccount')}
        </button>
      </div>

      {/* Account Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('accountDetails')}</DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t('accountName')}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedAccount.accountName.split(' ').map(
                      (w) => w.charAt(0) + w.slice(1).toLowerCase()
                    ).join(' ')}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t('accountNumber')}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedAccount.accountNumber}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t('addedOn')}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedAccount.addedOn}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('status')}</span>
                  <span className="text-sm">
                    {selectedAccount.isDefault ? (
                      <Badge
                        variant="outline"
                        className="text-primary border-primary"
                      >
                        {t('default')}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {!selectedAccount.isDefault && (
                  <Button
                    variant="outline"
                    onClick={() => handleSetDefault(selectedAccount.id)}
                  >
                    {t('setAsDefault')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveAccount(selectedAccount.id)}
                >
                  {t('removeAccount')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Account Modal (shared flow) */}
      <AddAccountModal
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}
