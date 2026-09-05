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

import { SaleDetail, SaleItem } from '../../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import SaleDetailsModal from '../sale_details_modal';
import { DUMMY_SALE_DETAIL } from '../../../models/data';

export function SalesTab({ sales }: { sales: SaleItem[] }) {
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const t = useTranslations('admin.sellers.salesTab');

  const handleViewSale = (sale: SaleItem) => {
    setSelectedSale({
      saleId: sale.auctionId,
      item: sale.item,
      itemImage: sale.itemImage,
      ...DUMMY_SALE_DETAIL,
    });
    setModalOpen(true);
  };

  if (!sales || sales.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{t('empty')}</p>;
  }
  return (
    <>
      <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-5rem)]">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="text-xs">{t('saleId')}</TableHead>
              <TableHead className="text-xs">{t('item')}</TableHead>
              <TableHead className="text-xs">{t('buyer')}</TableHead>
              <TableHead className="text-xs">{t('amount')}</TableHead>
              <TableHead className="text-xs">{t('date')}</TableHead>
              <TableHead className="text-xs">{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs font-medium">
                  {sale.auctionId}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sale.itemImage && (
                      <div className="relative h-8 w-10">
                        <Image
                          src={sale.itemImage}
                          alt={sale.item}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs truncate max-w-[140px]">
                      {sale.item}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {sale.buyer?.name ?? '—'}
                </TableCell>
                <TableCell className="text-xs">
                  {formatCurrency(sale.amount)}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {sale.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusStyles[sale.status] || ''}`}
                  >
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewSale(sale)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SaleDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sale={selectedSale}
      />
    </>
  );
}
