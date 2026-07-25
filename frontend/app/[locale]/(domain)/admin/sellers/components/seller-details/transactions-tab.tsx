'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';

import { SellerTransactionDetail, TransactionItem } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import SellerTransactionDetailsModal from '../seller_transaction_details_modal';
import { DUMMY_SELLER_TXN_DETAIL } from '../../../models/data';

export function TransactionsTab({
  transactions,
}: {
  transactions: TransactionItem[];
}) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<SellerTransactionDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewTransaction = (txn: TransactionItem) => {
    setSelectedTransaction({
      amount: txn.amount,
      status:
        txn.status === 'Successful'
          ? 'Successful'
          : txn.status === 'Failed'
            ? 'Failed'
            : 'Pending',
      ...DUMMY_SELLER_TXN_DETAIL,
      billing: {
        ...DUMMY_SELLER_TXN_DETAIL.billing,
        paymentMethod: txn.method,
        transactionId: txn.txnId,
        type: txn.type,
      },
    });
    setModalOpen(true);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No transactions yet.</p>
    );
  }
  return (
    <>
      <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-5rem)]">
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
                <TableCell className="text-xs font-medium">
                  {txn.txnId}
                </TableCell>
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

      <SellerTransactionDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={selectedTransaction}
      />
    </>
  );
}
