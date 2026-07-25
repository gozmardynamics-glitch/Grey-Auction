'use client';

import { useState } from 'react';
import { ChevronRight, Plus} from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';
import AddAccountModal from '@/shared/components/add_account_steps/add_account_modal';

interface BankAccount {
  id: string;
  bankName: string;
  bankLogo: string;
  accountHolder: string;
  accountNumber: string;
  addedOn: string;
  isDefault: boolean;
}

const DUMMY_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Wema Bank Plc',
    bankLogo: '🟣',
    accountHolder: 'Jayden Nicholas',
    accountNumber: '0123456789',
    addedOn: '21 January, 2026',
    isDefault: true,
  },
  {
    id: 'bank-2',
    bankName: 'GTCO',
    bankLogo: '🟠',
    accountHolder: 'Jayden Nicholas',
    accountNumber: '0123456789',
    addedOn: '15 February, 2026',
    isDefault: false,
  },
];

export default function SellerPaymentSettings() {
  const [accounts, setAccounts] = useState<BankAccount[]>(DUMMY_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowDetails(true);
  };

  const handleRemoveClick = () => {
    setShowDetails(false);
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = () => {
    if (selectedAccount) {
      setAccounts((prev) => prev.filter((a) => a.id !== selectedAccount.id));
    }
    setShowRemoveConfirm(false);
    setSelectedAccount(null);
  };

  const handleAddAccountSuccess = () => {
    // TODO: refresh accounts from API
  };

  const maskedNumber = (num: string) =>
    `******${num.slice(-4)}`;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="cursor-pointer transition-colors hover:bg-muted/30"
            onClick={() => handleSelectAccount(account)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{account.bankLogo}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {account.bankName}
                    </span>
                    {account.isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[10px]"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {account.accountHolder} &bull; {maskedNumber(account.accountNumber)}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}

        {/* Add Bank Account */}
        <Card
          className="cursor-pointer border-dashed transition-colors hover:bg-muted/30"
          onClick={() => setShowAddAccount(true)}
        >
          <CardContent className="flex h-full items-center justify-center gap-2 p-4">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Add Bank Account
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Account Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md p-0">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle>Account Details</DialogTitle>
            </DialogHeader>

            {selectedAccount && (
              <>
                <div className="rounded-lg border">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <span className="text-sm font-medium">{selectedAccount.accountHolder}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm text-muted-foreground">Account Number</span>
                    <span className="text-sm font-medium">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm text-muted-foreground">Added On</span>
                    <span className="text-sm font-medium">{selectedAccount.addedOn}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {selectedAccount.isDefault ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-xs"
                      >
                        Default
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium">Active</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleRemoveClick}
                  >
                    Remove Bank Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Bank Account Confirmation */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="max-w-md p-0">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle>Remove Bank Account</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove this bank account? Once removed,
              payouts will be paused until a new bank account is added.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRemove}
              >
                Yes, Remove Bank Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Modal (shared flow) */}
      <AddAccountModal
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        onSuccess={handleAddAccountSuccess}
      />
    </div>
  );
}
