'use client';

import { ChevronLeft, Download, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';

import { toast } from 'sonner';

import { Badge, Button, Separator } from '@/shared/components/common';
import EscrowStatus from '@/shared/components/escrow/escrow_status';
import { useAppSelector } from '@/redux/store';

import type { PurchaseInvoice } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { downloadInvoicePdf } from '@/shared/utils/invoice';

interface PurchaseDetailProps {
  invoice: PurchaseInvoice;
  onBack: () => void;
}

export default function PurchaseDetail({
  invoice,
  onBack,
}: PurchaseDetailProps) {
  const authToken = useAppSelector((state) => state.auth.token);
  // The invoice is the record of what was charged. Recomputing a premium from
  // an assumed rate produced a total that could disagree with the document the
  // buyer actually paid against.
  const lines = invoice.breakdown ?? null;
  const subtotal = lines?.hammerPrice ?? invoice.amount;
  const auctionFee = lines?.buyerPremium ?? 0;
  const vatOnBidValue = lines?.vat ?? 0;
  const otherCharges = (lines?.fixedFee ?? 0) + (lines?.otherCharges ?? 0);
  const totalBidAmount = lines?.total ?? invoice.amount;

  const handleDownloadInvoice = async () => {
    if (invoice.status !== 'Paid') {
      toast.info('Invoice will be available after payment');
      return;
    }
    try {
      await downloadInvoicePdf(invoice.id, authToken);
    } catch {
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{invoice.invoiceId}</span>
            <Badge variant="outline" className={statusStyles[invoice.status]}>
              {invoice.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleDownloadInvoice}
        >
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>
      </div>

      {/* Two-column layout: Invoice Details + Vendor Details */}
      <div className=" grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="md:col-span-2 space-y-4 rounded-lg border p-5">
          <h3 className="text-base font-semibold">Invoice Details</h3>
          <div className="space-y-3">
            <DetailRow
              label="Invoice Number"
              value={invoice.invoiceId}
              valueClassName="text-primary"
            />
            <DetailRow label="Issue Date" value="12-01-2026" />
            <DetailRow label="Due Date" value="20-01-2026" />
            <Separator />
            <DetailRow label="Billed To" value="Wema Bank" />
            <DetailRow
              label="Billed Details"
              value="Adetokunbo Street, Victoria Island, Lagos, Nigeria"
              valueClassName="text-right sm:max-w-[240px]"
            />
          </div>
        </div>

        {/* Vendor Details */}
        <div className="space-y-5 rounded-lg border p-5">
          <h3 className="text-base font-semibold">Vendor Details</h3>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src="/placeholder.svg"
                alt={invoice.vendor}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Grey Automobile</p>
              <p className="text-xs text-muted-foreground">
                greyautomobile@gmail.com
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Lagos, Nigeria</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>+2348143601064</span>
            </div>
          </div>
          <Button className="w-full">Send a Message</Button>
        </div>
      </div>

      {/* Item Details */}
      <div className="space-y-4 rounded-lg border p-5">
        <h3 className="text-base font-semibold">Item Details</h3>
        {/* Item table header */}
        <div className="grid grid-cols-3 border-b pb-2 text-sm text-muted-foreground">
          <span>Item</span>
          <span className="text-center">Quantity</span>
          <span className="text-right">Amount</span>
        </div>
        {/* Item row */}
        <div className="grid grid-cols-3 pb-4 text-sm font-medium">
          <span>{invoice.item}</span>
          <span className="text-center">1</span>
          <span className="text-right">{formatCurrency(subtotal)}</span>
        </div>
        {/* Summary rows — every figure is a stored invoice line, so what is
            shown here always matches the document that was charged. */}
        <div className="space-y-3 border-t pt-4">
          <SummaryRow label="Hammer price" value={formatCurrency(subtotal)} />
          {auctionFee > 0 && (
            <SummaryRow label="Buyer premium" value={formatCurrency(auctionFee)} />
          )}
          {vatOnBidValue > 0 && (
            <SummaryRow label="VAT" value={formatCurrency(vatOnBidValue)} />
          )}
          {otherCharges > 0 && (
            <SummaryRow label="Other charges" value={formatCurrency(otherCharges)} />
          )}
          <SummaryRow
            label="Total Bid Amount"
            value={formatCurrency(totalBidAmount)}
            bold
          />
          {!lines && (
            <p className="text-xs text-muted-foreground">
              The itemised breakdown is not available for this invoice; the total
              above is what was charged.
            </p>
          )}
        </div>
      </div>

      {/* Escrow & Settlement — funds lifecycle for this invoice */}
      <div className="space-y-3 rounded-lg border p-5">
        <div>
          <h3 className="text-base font-semibold">Escrow &amp; Settlement</h3>
          <p className="text-xs text-muted-foreground">
            Your payment is held by Grey Auction until you confirm receipt of the lot.
          </p>
        </div>
        <EscrowStatus invoiceId={invoice.id} token={authToken ?? undefined} />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className={bold ? 'font-semibold' : 'font-medium'}>{value}</span>
    </div>
  );
}
