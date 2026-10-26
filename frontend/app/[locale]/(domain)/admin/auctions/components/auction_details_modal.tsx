'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/shared/utils/api-client';

import {
  ActionSuccessDialog,
  Badge,
  Button,
  Card,
  ConfirmActionDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';
import Image from 'next/image';
import { type AuctionDetail, formatCurrency } from './auction_details_data';
import { statusStyles } from '@/shared/utils/helpers';
import { InfoRow, SectionTitle } from './auction_sub_components';
import {
  PendingRightColumn,
  CompletedRightColumn,
  RejectedRightColumn,
} from './auction_right_columns';

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: AuctionDetail | null;
}

export default function AuctionDetailsModal({
  open,
  onOpenChange,
  auction,
}: AuctionDetailsModalProps) {
  const t = useTranslations('admin.auctions.details');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVariant, setSuccessVariant] = useState<
    'approved' | 'rejected' | null
  >(null);

  if (!auction) return null;

  // Moderation runs against the products controller: POST products/:id/approve
  // and POST products/:id/reject (ApproveProductDto / RejectProductDto). The
  // dialog only closes once the call resolved — no optimistic success.
  const moderate = async (
    action: 'approve' | 'reject',
    body: Record<string, unknown>,
    failureMessage: string,
  ) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`products/${auction.id}/${action}`, {
        method: 'POST',
        body,
      });
      if (action === 'approve') {
        setApproveOpen(false);
        setSuccessVariant('approved');
      } else {
        setRejectOpen(false);
        setSuccessVariant('rejected');
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : failureMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Rows reach this modal in two shapes: the admin listing labels
  // ('Pending', 'Active', …) and the API statuses ('pending_approval',
  // 'active', 'sold', …) when real products are loaded. Match both, otherwise
  // moderation is unreachable on live data.
  const status = String(auction.status ?? '').toLowerCase();
  const moderatable = [
    'pending',
    'pending_approval',
    'active',
    'approved',
    'new',
  ].includes(status);
  const isCompleted = [
    'completed',
    'sold',
    'closed',
    'awaiting_seller_approval',
  ].includes(status);
  const isRejected = ['rejected', 'withdrawn'].includes(status);
  const isFlagged = status === 'flagged' || status === 'draft';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[60%] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="md:flex md:items-center md:justify-between">
              <DialogTitle className="text-lg font-semibold">
                {t('title')}
              </DialogTitle>
              {moderatable && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectOpen(true)}
                  >
                    {tAdmin('reject')}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-primary-foreground"
                    onClick={() => setApproveOpen(true)}
                  >
                    {t('approveAuction')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 p-6 pt-4 lg:grid-cols-2">
            {/* ====== LEFT COLUMN ====== */}
            <div className="space-y-5">
              {/* Item Header */}
              <Card className="flex gap-4 bg-card p-2">
                <div className="relative">
                  {auction.itemImage && (
                    <Image
                      src={auction.itemImage}
                      alt={auction.item}
                      fill
                      className="h-16 w-20 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {auction.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusStyles[auction.status]}
                    >
                      {auction.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{auction.item}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {auction.sellerReserveNotYetMet && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {t('sellerReserveNotYetMet')}
                      </span>
                    )}
                    {auction.saleStatus && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {t('saleStatus', { status: auction.saleStatus })}
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Auction Information */}
              <SectionTitle>{t('auctionInformation')}</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow label={t('category')} value={auction.category} />
                <InfoRow label={t('duration')} value={auction.duration || '-'} />
                <InfoRow label={t('startDate')} value={auction.startDate || '-'} />
                <InfoRow label={t('endDate')} value={auction.endDate} />
              </Card>

              {/* Bid Information */}
              <SectionTitle>{t('bidInformation')}</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow
                  label={t('startingPrice')}
                  value={
                    auction.startingPrice
                      ? formatCurrency(auction.startingPrice)
                      : formatCurrency(auction.startingBid)
                  }
                />
                <InfoRow
                  label={t('bidIncrement')}
                  value={
                    auction.bidIncrement
                      ? formatCurrency(auction.bidIncrement)
                      : '-'
                  }
                />
                <InfoRow
                  label={t('reservePrice')}
                  value={auction.reservePrice || '-'}
                />
                <InfoRow
                  label={t('reservePriceAt')}
                  value={
                    auction.reservePriceAmount
                      ? formatCurrency(auction.reservePriceAmount)
                      : '-'
                  }
                />
                <InfoRow
                  label={t('allowBuyNow')}
                  value={auction.allowBuyNow || '-'}
                />
                <InfoRow
                  label={t('buyNowAt')}
                  value={
                    auction.buyNowPrice
                      ? formatCurrency(auction.buyNowPrice)
                      : '-'
                  }
                />
              </Card>

              {/* Inspection Information */}
              <SectionTitle>{t('inspectionInformation')}</SectionTitle>
              <Card className="grid grid-cols-2 gap-4 bg-card p-2">
                <InfoRow
                  label={t('allowInspection')}
                  value={auction.allowInspection || '-'}
                />
                <InfoRow
                  label={t('duration')}
                  value={auction.inspectionDuration || '-'}
                />
              </Card>
              {auction.inspectionAddress && (
                <Card className="space-y-1 bg-card p-2">
                  <p className="text-sm text-muted-foreground">
                    {t('inspectionAddress')}
                  </p>
                  <p className="text-sm font-medium">
                    {auction.inspectionAddress}
                  </p>
                </Card>
              )}
            </div>

            {/* ====== RIGHT COLUMN (status-dependent) ====== */}
            <div className="space-y-5">
              {moderatable && <PendingRightColumn auction={auction} />}
              {isCompleted && <CompletedRightColumn auction={auction} />}
              {isRejected && <RejectedRightColumn auction={auction} />}
              {isFlagged && <CompletedRightColumn auction={auction} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        variant="approve"
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={t('approveConfirm.title')}
        consequenceLabel={t('approveConfirm.consequenceLabel')}
        consequences={[
          t('approveConfirm.consequence1'),
          t('approveConfirm.consequence2'),
          t('approveConfirm.consequence3'),
          t('approveConfirm.consequence4'),
        ]}
        checkboxLabel={t('approveConfirm.checkboxLabel')}
        confirmLabel={t('approveConfirm.confirm')}
        onConfirm={() => {
          void moderate('approve', {}, 'Could not approve the auction');
        }}
      />

      <ConfirmActionDialog
        variant="reject"
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t('rejectConfirm.title')}
        consequenceLabel={t('rejectConfirm.consequenceLabel')}
        consequences={[
          t('rejectConfirm.consequence1'),
          t('rejectConfirm.consequence2'),
          t('rejectConfirm.consequence3'),
          t('rejectConfirm.consequence4'),
        ]}
        textareaPlaceholder={t('rejectConfirm.placeholder')}
        confirmLabel={t('rejectConfirm.confirm')}
        onConfirm={(reason) => {
          void moderate(
            'reject',
            { rejectionReason: reason.trim() },
            'Could not reject the auction',
          );
        }}
      />

      {successVariant && (
        <ActionSuccessDialog
          open={!!successVariant}
          onOpenChange={() => setSuccessVariant(null)}
          variant={successVariant === 'approved' ? 'success' : 'error'}
          title={
            successVariant === 'approved'
              ? t('success.approvedTitle')
              : t('success.rejectedTitle')
          }
          message={
            successVariant === 'approved'
              ? t('success.approvedMessage')
              : t('success.rejectedMessage')
          }
        />
      )}
    </>
  );
}
