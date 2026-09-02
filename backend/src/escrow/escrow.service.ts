import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThan, Repository } from 'typeorm';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';
import { Invoice } from '../invoices/invoice.entity';

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
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EscrowHold);
      const existing = await repo.findOne({
        where: { invoiceId: input.invoiceId, status: In(OPEN_STATUSES) },
        lock: { mode: 'pessimistic_write' },
      });
      if (existing) throw new ConflictException('Funds are already in escrow for this invoice');

      // U5 answer #4 — the auto-release window was fixed on the invoice at
      // creation (from the lot's escrowReleaseHours). Compute when it opens.
      const invoice = await manager.getRepository(Invoice).findOne({
        where: { id: input.invoiceId },
      });
      const windowHours = invoice?.escrow_window_hours ?? null;
      const releaseAt = this.computeReleaseAt(windowHours, invoice?.paid_at);

      return repo.save(repo.create({
        invoiceId: input.invoiceId,
        amount: input.amount,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        status: EscrowStatus.HELD,
        autoReleaseAt: releaseAt,
      }));
    });
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
      // Payout: credit the seller's wallet in the same transaction so the
      // escrow state transition and the wallet credit commit atomically.
      await this.walletService.creditInManager(manager, hold.sellerId, {
        amount: hold.amount,
        reference: 'escrow_release:' + hold.id,
        description: 'Escrow release for invoice ' + hold.invoiceId,
        type: WalletTransactionType.ESCROW_RELEASE,
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
            amount: locked.amount,
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
