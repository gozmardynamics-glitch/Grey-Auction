'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Image from 'next/image';
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

import { AuctionActivityItem, AuctionDetail } from '../../../models';
import { statusStyles } from '@/shared/utils/helpers';
import AuctionDetailsModal from './auction-details-modal';
import { DUMMY_AUCTION_DETAIL } from '../../../models/data';

export function AuctionsTab({ auctions }: { auctions: AuctionActivityItem[] }) {
  const [selectedAuction, setSelectedAuction] = useState<AuctionDetail | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const t = useTranslations('admin.sellers.auctionsTab');

  const handleViewAuction = (auction: AuctionActivityItem) => {
    setSelectedAuction({
      auctionId: auction.auctionId,
      item: auction.item,
      itemImage: auction.itemImage,
      category: auction.category,
      ...DUMMY_AUCTION_DETAIL,
    });
    setModalOpen(true);
  };

  if (!auctions || auctions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t('empty')}
      </p>
    );
  }
  return (
    <>
      <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-5rem)]">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="text-xs">{t('aucId')}</TableHead>
              <TableHead className="text-xs">{t('item')}</TableHead>
              <TableHead className="text-xs">{t('duration')}</TableHead>
              <TableHead className="text-xs">{t('startingBid')}</TableHead>
              <TableHead className="text-xs">{t('date')}</TableHead>
              <TableHead className="text-xs">{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auctions.map((auction, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs font-medium">
                  {auction.auctionId}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {auction.itemImage && (
                      <div className="relative h-8 w-10">
                        <Image
                          src={auction.itemImage}
                          alt={auction.item}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs truncate max-w-[140px]">
                      {auction.item}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {auction.duration || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {auction.duration || '-'}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {auction.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusStyles[auction.status] || ''}`}
                  >
                    {auction.status || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewAuction(auction)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AuctionDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        auction={selectedAuction}
      />
    </>
  );
}
