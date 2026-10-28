import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';

export interface GenerateInvoiceDto {
  auctionId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  hammerPrice: number;
  commission: number;
  vat: number;
  fixedFee: number;
  /** U5: seller-side platform commission (from the fee-resolution source). */
  sellerFee?: number;
  /** U5: fee-resolution provenance: product | seller | category | default. */
  feeSource?: string;
  /** U5: which VAT base was active when the invoice was issued. */
  vatBase?: string;
  /** U5: escrow auto-release window snapshot (hours); 0 = immediate. */
  escrowWindowHours?: number | null;
  /** Settlement currency (ISO-4217). Defaults to NGN. */
  currency?: string;
  /** Percentage-based extra charge from the resolved breakdown. */
  otherCharges?: number;
}

/**
 * Issues an invoice inside a caller-supplied transaction.
 *
 * Deliberately has **no dependencies**. Invoices are created by the settlement
 * cron, the buy-now flow and the admin route; the buy-now flow lives in
 * OrderModule, and OrderModule must not import InvoiceModule because
 * InvoiceModule needs OrderService to settle a payment — a cycle. A
 * dependency-free seam lets both sides share one implementation instead of
 * duplicating the numbering rules.
 *
 * Number allocation is serialized with a transaction-scoped advisory lock:
 * two concurrent creators (webhook vs cron) both computing count+1 would
 * otherwise collide on the unique invoice_number.
 */
@Injectable()
export class InvoiceFactoryService {
  async create(manager: EntityManager, data: GenerateInvoiceDto): Promise<Invoice> {
    const repo = manager.getRepository(Invoice);
    // Serialize number allocation: two concurrent creators (webhook vs cron)
    // both computing count+1 would collide on the unique invoice_number.
    // The lock is transaction-scoped and released automatically at commit.
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext('greyauction_invoice_number')::bigint)`);
    const count = await repo.count();
    const next = count + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(next).padStart(6, '0')}`;

    // Every component is persisted individually and the total is the sum of the
    // values actually stored, so the printed lines always equal what is charged.
    // `otherCharges` used to be dropped here, which understated every invoice
    // the moment an admin configured otherChargesPct.
    const hammerPrice = Number(data.hammerPrice) || 0;
    const commission = Number(data.commission) || 0;
    const vat = Number(data.vat) || 0;
    const fixedFee = Number(data.fixedFee) || 0;
    const sellerFee = Number(data.sellerFee ?? 0) || 0;
    const otherCharges = Number(data.otherCharges ?? 0) || 0;

    const total =
      hammerPrice + commission + vat + fixedFee + otherCharges;
    const sellerNet = hammerPrice - sellerFee;
    const platformShare = commission + sellerFee + fixedFee + otherCharges;

    const invoice = repo.create({
      invoice_number: invoiceNumber,
      auction_id: data.auctionId,
      product_id: data.productId,
      buyer_id: data.buyerId,
      seller_id: data.sellerId,
      hammer_price: hammerPrice,
      commission,
      vat,
      fixed_fee: fixedFee,
      other_charges: otherCharges,
      seller_fee: sellerFee,
      seller_net: sellerNet,
      platform_share: platformShare,
      fee_source: data.feeSource ?? 'default',
      vat_base: data.vatBase ?? 'hammer_and_fees',
      escrow_window_hours: data.escrowWindowHours ?? null,
      currency: (data.currency || 'NGN').toUpperCase(),
      escrow_release_at: null,
      total,
      status: InvoiceStatus.ISSUED,
      issued_at: new Date(),
    });

    return repo.save(invoice);
  
  }
}
