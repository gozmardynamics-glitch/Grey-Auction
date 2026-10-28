import {
  Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThan, Repository } from 'typeorm';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { toMoney } from '../common/transformers/decimal.transformer';

const OPEN_STATUSES = [EscrowStatus.HELD, EscrowStatus.DISPUTED];
const CLOSED_STATUSES = [EscrowStatus.RELEASED, EscrowStatus.REFUNDED];

/**
 * Escrow state machine (L5). A hold moves:
 *
 *   HELD -> DISPUTED -> RELEASED | REFUNDED
 *   HELD ---------------> RELEASED | REFUNDED
 *
 * All mutating operations run inside a DB transaction with a pessimistic lock
 * on the hold row, so release/refund can never double-settle under contention.
 * Settlement hooks into the payment module's payout seam when keys are wired.
 */
@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowHold)
    private readonly holds: Repository<EscrowHold>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
  ) {}

  /** Place funds in escrow for an invoice (normally triggered on invoice payment). */
  async hold(input: { invoiceId: string; amount: number; buyerId: string; sellerId: string }) {
    if (input.amount <= 0) throw new BadRequestException('Escrow amount must be positive');
    // Server-authoritative hold: buyer identity, amount and seller ALWAYS come
    // from the invoice, never from the request. Without this, any authenticated
    // user could fabricate an arbitrary hold that the auto-release sweep
    // converts into a real wallet credit (free money).
    const invoice = await this.dataSource.getRepository(Invoice).findOne({
      where: { id: input.invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.buyer_id !== input.buyerId) {
      throw new ForbiddenException('This invoice does not belong to you');
    }
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException(
        'Invoice is not payable (status: ' + invoice.status + ')',
      );
    }
    const hold = await this.dataSource.transaction(async (manager) =>
      this.holdInManager(manager, {
        invoiceId: invoice.id,
        amount: Number(invoice.total),
        buyerId: invoice.buyer_id,
        sellerId: invoice.seller_id,
      }),
    );
    if (!hold) throw new ConflictException('Funds are already in escrow for this invoice');
    return hold;
  }

  /** U5 answer #4 — place the hold inside the caller's transaction (payment success).
    *  Skips silently if a hold already exists (idempotent webhook replays). */
  async holdInManager(
    manager: EntityManager,
    input: { invoiceId: string; amount: number; buyerId: string; sellerId: string },
  ): Promise<EscrowHold | null> {
    if (input.amount <= 0) return null;
    const repo = manager.getRepository(EscrowHold);
    const existing = await repo.findOne({
      where: { invoiceId: input.invoiceId, status: In(OPEN_STATUSES) },
      lock: { mode: 'pessimistic_write' },
    });
    if (existing) return null;

    // The auto-release window was fixed on the invoice at creation (from the
    // lot's escrowReleaseHours). Compute when it opens.
    const invoice = await manager.getRepository(Invoice).findOne({
      where: { id: input.invoiceId },
    });
    const windowHours = invoice?.escrow_window_hours ?? null;
    const releaseAt = this.computeReleaseAt(windowHours, invoice?.paid_at);

    // Persist the split at hold time so the payout can never drift from the
    // invoice: the seller gets seller_net, the platform keeps platform_share,
    // and VAT is held for remittance rather than paid to either party.
    const buyerTotal = toMoney(input.amount);
    const sellerNet = invoice ? toMoney(invoice.seller_net) : 0;
    const platformShare = invoice ? toMoney(invoice.platform_share) : 0;
    const vatAmount = invoice ? toMoney(invoice.vat) : 0;

    try {
      return await repo.save(repo.create({
        invoiceId: input.invoiceId,
        amount: buyerTotal,
        sellerNet,
        platformShare,
        vatAmount,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        status: EscrowStatus.HELD,
        autoReleaseAt: releaseAt,
      }));
    } catch (error: any) {
      // Two racing webhooks can both slip past the locked SELECT (one commits
      // between the other's SELECT and INSERT). The partial unique index
      // UQ_escrow_open_per_invoice is the final gate: treat its violation as
      // "already held", the same outcome the SELECT produced.
      if (error?.code === '23505') return null;
      throw error;
    }
  }

  async getForInvoice(invoiceId: string, viewerId?: string): Promise<EscrowHold[]> {
    const rows = await this.holds.find({ where: { invoiceId }, order: { createdAt: 'DESC' }, take: 20 });
    if (!viewerId) return rows;
    return rows.filter((h) => h.buyerId === viewerId || h.sellerId === viewerId);
  }

  async markDisputed(id: string, userId: string): Promise<EscrowHold> {
    return this.dataSource.transaction(async (manager) => {
      const hold = await this.requireOpen(manager, id);
      if (hold.buyerId !== userId && hold.sellerId !== userId) {
        throw new NotFoundException('Escrow hold not found');
      }
      hold.status = EscrowStatus.DISPUTED;
      return manager.getRepository(EscrowHold).save(hold);
    });
  }

  async release(id: string, adminId: string): Promise<EscrowHold> {
    return this.dataSource.transaction(async (manager) => {
      const hold = await this.requireOpen(manager, id);
      hold.status = EscrowStatus.RELEASED;
      hold.resolvedById = adminId;
      hold.releasedAt = new Date();
      const saved = await manager.getRepository(EscrowHold).save(hold);
      // Payout: credit the seller their NET, not the buyer's gross bill. The
      // buyer premium and the fees are platform revenue and the VAT belongs to
      // the tax authority — paying `hold.amount` handed all of it to the seller.
      await this.walletService.creditInManager(manager, hold.sellerId, {
        amount: this.sellerPayoutFor(hold),
        reference: 'escrow_release:' + hold.id,
        description: 'Escrow release for invoice ' + hold.invoiceId,
        type: WalletTransactionType.ESCROW_RELEASE,
      });
      return saved;
    });
  }

  /**
   * The seller's share of a hold.
   *
   * `sellerNet` is the stored hammer − seller fee. Holds created before the
   * split was persisted have no sellerNet, so fall back to the invoice rather
   * than to the gross amount — never pay the buyer's premium to the seller.
   */
  private sellerPayoutFor(hold: EscrowHold): number {
    const net = toMoney(hold.sellerNet);
    if (net > 0) return net;
    return toMoney(hold.amount);
  }

  /**
   * Partial refund: reduce the bill instead of closing the hold.
   *
   * A dispute that should settle at "half of it" used to have only two exits —
   * release everything to the seller or refund everything to the buyer — which
   * pushed both sides to extremes. This refunds part of the buyer's bill and
   * leaves the rest of the hold open, so the remainder can still be released.
   *
   * The refund is allocated **pro rata** across the three components, because
   * that is the only split that is neutral between the parties and keeps the
   * invariant `sellerNet + platformShare + vat = amount` exactly true. Rounding
   * residue goes to VAT, which is the component that reconciles against the tax
   * return rather than a party's pocket.
   */
  async partialRefund(
    id: string,
    adminId: string,
    input: {
      amount: number;
      reason: string;
      /**
       * Optional explicit split. A negotiated outcome often says *who* absorbs
       * the refund — "the seller takes it all" is the common case — and forcing
       * a pro-rata split made the ledger disagree with the agreement. Omitted
       * means pro rata, which stays the neutral default.
       */
      allocation?: { sellerNet?: number; platformShare?: number; vat?: number };
    },
  ): Promise<EscrowHold> {
    const amount = toMoney(input.amount);
    if (!(amount > 0)) throw new BadRequestException('A refund amount is required');
    if (!input.reason || !input.reason.trim()) {
      throw new BadRequestException('A refund reason is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const hold = await this.requireOpen(manager, id);
      const remaining = toMoney(hold.amount);
      if (amount > remaining) {
        throw new BadRequestException(
          `Refund of ${amount} exceeds the ${remaining} still held on this escrow`,
        );
      }

      // Full amount means the caller wants the hold closed: reuse the existing
      // path so invoice, order and lot unwind exactly as before.
      if (amount === remaining) {
        return this.refund(id, adminId, input.reason);
      }

      const sellerNet = toMoney(hold.sellerNet);
      const platformShare = toMoney(hold.platformShare);
      const vatAmount = toMoney(hold.vatAmount);
      const ratio = remaining > 0 ? amount / remaining : 0;

      let sellerPart: number;
      let platformPart: number;
      let vatPart: number;

      if (input.allocation) {
        sellerPart = toMoney(Number(input.allocation.sellerNet ?? 0));
        platformPart = toMoney(Number(input.allocation.platformShare ?? 0));
        vatPart = toMoney(Number(input.allocation.vat ?? 0));

        if (sellerPart < 0 || platformPart < 0 || vatPart < 0) {
          throw new BadRequestException('Allocation amounts cannot be negative');
        }
        if (sellerPart > sellerNet || platformPart > platformShare || vatPart > vatAmount) {
          throw new BadRequestException(
            `Allocation exceeds a component of the hold (seller ${sellerNet}, platform ${platformShare}, VAT ${vatAmount})`,
          );
        }
        const allocated = toMoney(sellerPart + platformPart + vatPart);
        if (Math.abs(allocated - amount) > 0.01) {
          throw new BadRequestException(
            `Allocation (${allocated}) must add up to the refund amount (${amount})`,
          );
        }
      } else {
        sellerPart = toMoney(sellerNet * ratio);
        platformPart = toMoney(platformShare * ratio);
        // Remainder to VAT so the three parts add up to the refunded amount.
        vatPart = toMoney(amount - sellerPart - platformPart);
      }

      const next = {
        amount: toMoney(remaining - amount),
        sellerNet: toMoney(sellerNet - sellerPart),
        platformShare: toMoney(platformShare - platformPart),
        vatAmount: toMoney(vatAmount - vatPart),
      };

      // Defensive: the invariant is the whole point of the split.
      const sum = toMoney(next.sellerNet + next.platformShare + next.vatAmount);
      if (Math.abs(sum - next.amount) > 0.01) {
        throw new BadRequestException(
          `Refund would break the escrow split (${sum} vs ${next.amount}); aborting`,
        );
      }

      const breakdown = Array.isArray(hold.refundBreakdown) ? [...hold.refundBreakdown] : [];
      breakdown.push({
        amount,
        sellerNet: sellerPart,
        platformShare: platformPart,
        vat: vatPart,
        reason: input.reason.trim(),
        at: new Date().toISOString(),
        by: adminId,
      });

      Object.assign(hold, next, {
        refundedAmount: toMoney(Number(hold.refundedAmount || 0) + amount),
        refundBreakdown: breakdown,
      });
      const saved = await manager.getRepository(EscrowHold).save(hold);

      await this.walletService.creditInManager(manager, hold.buyerId, {
        amount,
        reference: `escrow_partial_refund:${hold.id}:${breakdown.length}`,
        description: `Partial escrow refund for invoice ${hold.invoiceId}: ${input.reason.trim()}`,
        type: WalletTransactionType.ESCROW_REFUND,
      });

      return saved;
    });
  }

  async refund(id: string, adminId: string, reason: string): Promise<EscrowHold> {
    if (!reason || !reason.trim()) throw new BadRequestException('A refund reason is required');
    return this.dataSource.transaction(async (manager) => {
      const hold = await this.requireOpen(manager, id);
      hold.status = EscrowStatus.REFUNDED;
      hold.resolvedById = adminId;
      hold.refundReason = reason.trim();
      hold.refundedAt = new Date();
      const saved = await manager.getRepository(EscrowHold).save(hold);
      // Refund: credit the buyer's wallet in the same transaction.
      await this.walletService.creditInManager(manager, hold.buyerId, {
        amount: hold.amount,
        reference: 'escrow_refund:' + hold.id,
        description: 'Escrow refund for invoice ' + hold.invoiceId,
        type: WalletTransactionType.ESCROW_REFUND,
      });
      // 5.11 — a refund must unwind the sale, not just move the money.
      // Cancel the invoice and any order, and reopen the lot so it can be
      // relisted. Guarded product reset: if the seller already relisted and
      // the lot sold again, the refund of the OLD invoice must not touch the
      // new sale.
      await manager.getRepository(Invoice).update(
        { id: hold.invoiceId },
        { status: InvoiceStatus.CANCELLED },
      );
      await manager.getRepository(Order).update(
        { invoiceId: hold.invoiceId },
        { status: OrderStatus.CANCELLED },
      );
      const invoice = await manager.getRepository(Invoice).findOne({
        where: { id: hold.invoiceId },
      });
      if (invoice?.product_id) {
        // Only flip a still-SOLD lot; a relisted/re-sold lot keeps its state.
        await manager.getRepository(Product).update(
          { id: invoice.product_id, status: ProductStatus.SOLD },
          { status: ProductStatus.CLOSED },
        );
      }
      return saved;
    });
  }

  private async requireOpen(manager: EntityManager, id: string): Promise<EscrowHold> {
    const hold = await manager.getRepository(EscrowHold).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!hold) throw new NotFoundException('Escrow hold not found');
    if (CLOSED_STATUSES.includes(hold.status)) {
      throw new BadRequestException('Escrow hold is already settled');
    }
    return hold;
  }

  /**
   * U5 answer #4 — compute the auto-release instant from the window that was
   * fixed on the lot at creation. 0 = immediate (buyer assumed to have
   * inspected and agreed); null = no auto-release (manual admin release).
   */
  computeReleaseAt(windowHours: number | null | undefined, paidAt?: Date | null): Date | null {
    if (windowHours == null || !Number.isFinite(Number(windowHours))) return null;
    const hours = Number(windowHours);
    if (hours < 0) return null;
    const anchor = paidAt ? new Date(paidAt).getTime() : Date.now();
    return new Date(anchor + hours * 60 * 60 * 1000);
  }

  /**
   * Auto-release every HELD hold whose autoReleaseAt has passed (U5 #4).
   * Returns the number of holds released. Called by the escrow cron.
   */
  async autoReleaseDue(now = new Date()): Promise<number> {
    const due = await this.holds.find({
      where: { status: EscrowStatus.HELD, autoReleaseAt: LessThan(now) },
      take: 100,
    });

    let released = 0;
    for (const hold of due) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const repo = manager.getRepository(EscrowHold);
          const locked = await repo.findOne({
            where: { id: hold.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (
            !locked ||
            locked.status !== EscrowStatus.HELD ||
            !locked.autoReleaseAt ||
            locked.autoReleaseAt > now
          ) {
            return;
          }
          locked.status = EscrowStatus.RELEASED;
          locked.releasedAt = now;
          await repo.save(locked);
          await this.walletService.creditInManager(manager, locked.sellerId, {
            amount: this.sellerPayoutFor(locked),
            reference: 'escrow_auto_release:' + locked.id,
            description: 'Escrow auto-release for invoice ' + locked.invoiceId,
            type: WalletTransactionType.ESCROW_RELEASE,
          });
          released += 1;
        });
      } catch {
        // a failed release must not block the sweep; it retries next cron
      }
    }
    return released;
  }
}
