
import { Download } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { InvoiceDetail } from '../../models';


interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetail | null;
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}


export default function InvoiceDetailsModal({
  open,
  onOpenChange,
  invoice,
}: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Invoice Header */}
        <DialogHeader className="p-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="text-base font-semibold">
              {invoice.invoiceNumber}
            </span>

            <Badge variant="outline" className={statusStyles[invoice.status]}>
              {invoice.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 p-6 pt-4">
          {/* Invoice Details */}
          <Card className="space-y-1 p-2">
            <h3 className="text-sm font-semibold mb-2">Invoice Details</h3>
            <InfoRow label="Invoice Number" value={invoice.invoiceNumber} />
            <InfoRow label="Issue Date" value={invoice.issueDate} />
            <InfoRow label="Due Date" value={invoice.dueDate} />
            <Separator />
            <InfoRow label="Billed To" value={invoice.billedTo} />
            <InfoRow label="Billed Details" value={invoice.billedDetails} />
          </Card>

          {/* Item Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Item Details</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="text-xs text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-0">
            <InfoRow
              label="Subtotal"
              value={formatCurrency(invoice.subtotal)}
            />
            <Separator />
            <InfoRow
              label={`Auction Fee (${invoice.auctionFeePercent}%)`}
              value={formatCurrency(invoice.auctionFee)}
            />
            <Separator />
            <InfoRow
              label="VAT on bid value"
              value={formatCurrency(invoice.vatOnBidValue)}
            />
            <Separator />
            <InfoRow
              label="SAT on auction fee"
              value={formatCurrency(invoice.satOnAuctionFee)}
            />
            <Separator />
            <div className="flex items-center justify-between py-2">
              <p className="text-sm font-semibold">Total Bid Amount</p>
              <p className="text-sm font-semibold">
                {formatCurrency(invoice.totalBidAmount)}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <Button className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
