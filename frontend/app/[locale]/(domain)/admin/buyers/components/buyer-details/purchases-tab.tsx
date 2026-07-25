'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import Image from 'next/image';
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
import { InvoiceDetail, PurchaseItem } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import InvoiceDetailsModal from '../invoice_details_modal';
import { DUMMY_INVOICE_DETAIL } from '../../../models/data';



export function PurchasesTab({ purchases }: { purchases: PurchaseItem[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const handleViewPurchase = (purchase: PurchaseItem) => {
    setSelectedInvoice({
      invoiceNumber: `INV-${purchase.auctionId.replace(/\s/g, '')}`,
      status: purchase.status === 'Completed' ? 'Paid' : purchase.status === 'Failed' ? 'Overdue' : 'Unpaid',
      ...DUMMY_INVOICE_DETAIL,
    });
    setInvoiceModalOpen(true);
  };

  if (!purchases || purchases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No purchases yet.</p>
    );
  }
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="text-xs">Invoice ID</TableHead>
              <TableHead className="text-xs">Item</TableHead>
              <TableHead className="text-xs">Bid Amount</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs font-medium">
                  {purchase.auctionId}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {purchase.itemImage && (
                      <div className="relative h-8 w-10">
                        <Image
                          src={purchase.itemImage}
                          alt={purchase.item}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs truncate max-w-[140px]">
                      {purchase.item}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {formatCurrency(purchase.amount)}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {purchase.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusStyles[purchase.status] || ''}`}
                  >
                    {purchase.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewPurchase(purchase)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailsModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoice={selectedInvoice}
      />
    </>
  );
}
