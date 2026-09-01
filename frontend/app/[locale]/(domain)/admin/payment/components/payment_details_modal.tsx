import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
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
import { PaymentDetail } from '../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';



interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentDetail | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator />
      <h3 className="text-sm font-semibold">{children}</h3>
    </>
  );
}


export default function PaymentDetailsModal({
  open,
  onOpenChange,
  payment,
}: PaymentDetailsModalProps) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60%] max-h-[60%] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 p-6 pt-4 lg:grid-cols-2">
          {/* ====== LEFT COLUMN ====== */}
          <div className="space-y-5">
            {/* Item Header */}
            <div className="flex gap-4">
              {payment.itemImage && (
                <div className="relative h-16 w-20">
                  <Image
                    src={payment.itemImage}
                    alt={payment.item}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {payment.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={statusStyles[payment.status]}
                  >
                    {payment.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{payment.item}</p>
                {payment.transactionRef && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {payment.transactionRef}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <SectionTitle>Payment Information</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Amount:" value={formatCurrency(payment.amount)} />
              <InfoRow label="Method:" value={payment.method} />
              <InfoRow label="Date:" value={payment.date} />
              <InfoRow label="Auction ID:" value={payment.auctionId || '-'} />
            </div>

            {/* Financial Breakdown */}
            <SectionTitle>Financial Breakdown</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Bid Amount:"
                value={
                  payment.bidAmount ? formatCurrency(payment.bidAmount) : '-'
                }
              />
              <InfoRow
                label="Fees:"
                value={payment.fees ? formatCurrency(payment.fees) : '-'}
              />
              <InfoRow
                label="Net Amount:"
                value={
                  payment.netAmount ? formatCurrency(payment.netAmount) : '-'
                }
              />
              <InfoRow
                label="Escrow Status:"
                value={payment.escrowStatus || '-'}
              />
            </div>
          </div>

          {/* ====== RIGHT COLUMN ====== */}
          <div className="space-y-5">
            {/* Buyer Details */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="text-sm font-semibold">Buyer Details</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={payment.buyerAvatar} alt={payment.buyer} />
                  <AvatarFallback>{payment.buyer.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-semibold">{payment.buyer}</span>
                  {payment.buyerEmail && (
                    <p className="text-xs text-muted-foreground">
                      {payment.buyerEmail}
                    </p>
                  )}
                </div>
              </div>
              {payment.buyerLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {payment.buyerLocation}
                </div>
              )}
              {payment.buyerPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {payment.buyerPhone}
                </div>
              )}
            </div>

            {/* Seller Details */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Seller Details</h3>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  View Profile
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={payment.sellerAvatar} alt={payment.seller} />
                  <AvatarFallback>{payment.seller.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">
                      {payment.seller}
                    </span>
                    {payment.sellerVerified && (
                      <svg
                        className="h-4 w-4 text-tertiary"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  {payment.sellerEmail && (
                    <p className="text-xs text-muted-foreground">
                      {payment.sellerEmail}
                    </p>
                  )}
                </div>
              </div>
              {payment.sellerLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {payment.sellerLocation}
                </div>
              )}
              {payment.sellerPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {payment.sellerPhone}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Payment History</h3>
              {payment.paymentHistory && payment.paymentHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Action</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payment.paymentHistory.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs font-medium">
                            {entry.action}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {entry.date}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusStyles[entry.status] || ''}`}
                            >
                              {entry.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment history available.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
