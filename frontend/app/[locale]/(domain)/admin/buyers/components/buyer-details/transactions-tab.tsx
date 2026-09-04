'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import {
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import { BuyerTransactionItem } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import TransactionDetailsModal from '../transaction_details_modal';
import { BuyerTransactionDetail } from '../../../models';
import { DUMMY_TXN_DETAIL } from '../../../models/data';

export function TransactionsTab({
  transactions,
}: {
  transactions: BuyerTransactionItem[];
}) {
  const [selectedTxn, setSelectedTxn] = useState<BuyerTransactionDetail | null>(null);
  const [txnModalOpen, setTxnModalOpen] = useState(false);

  const handleViewTransaction = (txn: BuyerTransactionItem) => {
    setSelectedTxn({
      amount: txn.amount,
      status: txn.status === 'Successful' ? 'Completed' : txn.status === 'Failed' ? 'Failed' : 'Pending',
      ...DUMMY_TXN_DETAIL,
      billing: {
        ...DUMMY_TXN_DETAIL.billing,
        transactionId: txn.txnId,
        deposit: txn.type,
      },
    });
    setTxnModalOpen(true);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Transactions will appear here once this buyer starts transacting."
        className="py-10"
      />
    );
  }
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="text-xs">Transaction ID</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs font-medium">{txn.txnId}</TableCell>
                <TableCell className="text-xs">{txn.type}</TableCell>
                <TableCell className="text-xs">
                  {formatCurrency(txn.amount)}
                </TableCell>
                <TableCell className="text-xs">{txn.method}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {txn.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusStyles[txn.status] || ''}`}
                  >
                    {txn.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewTransaction(txn)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailsModal
        open={txnModalOpen}
        onOpenChange={setTxnModalOpen}
        transaction={selectedTxn}
      />
    </>
  );
}
