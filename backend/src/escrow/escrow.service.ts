import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';

const OPEN_STATUSES = [EscrowStatus.HELD, EscrowStatus.DISPUTED];
const CLOSED_STATUSES = [EscrowStatus.RELEASED, EscrowStatus.REFUNDED];

/**
 * Escrow state machine (L5). A hold moves:
 *
 *   HELD -> DISPUTED -> RELEASED | REFUNDED
 *   HELD ---------------> RELEASED | REFUNDED
 *
 * It is intentionally provider-agnostic; settlement hooks into the payment
 * module's payout/disbursement seam when gateway keys are configured.
 */
@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowHold)
    private readonly holds: Repository<EscrowHold>,
  ) {}

  /** Place funds in escrow for an invoice (normally triggered on invoice payment). */
  async hold(input: { invoiceId: string; amount: number; buyerId: string; sellerId: string }) {
    if (input.amount <= 0) throw new BadRequestException('Escrow amount must be positive');
    const existing = await this.holds.findOne({
      where: { invoiceId: input.invoiceId, status: In(OPEN_STATUSES) },
    });
    if (existing) throw new ConflictException('Funds are already in escrow for this invoice');

    const hold = this.holds.create({
      invoiceId: input.invoiceId,
      amount: input.amount,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      status: EscrowStatus.HELD,
    });
    return this.holds.save(hold);
  }

  async getForInvoice(invoiceId: string, viewerId?: string): Promise<EscrowHold[]> {
    const rows = await this.holds.find({ where: { invoiceId }, order: { createdAt: 'DESC' }, take: 20 });
    if (!viewerId) return rows;
    return rows.filter((h) => h.buyerId === viewerId || h.sellerId === viewerId);
  }

  async markDisputed(id: string, userId: string): Promise<EscrowHold> {
    const hold = await this.requireOpen(id);
    if (hold.buyerId !== userId && hold.sellerId !== userId) {
      throw new NotFoundException('Escrow hold not found');
    }
    hold.status = EscrowStatus.DISPUTED;
    return this.holds.save(hold);
  }

  async release(id: string, adminId: string): Promise<EscrowHold> {
    const hold = await this.requireOpen(id);
    hold.status = EscrowStatus.RELEASED;
    hold.resolvedById = adminId;
    hold.releasedAt = new Date();
    return this.holds.save(hold);
  }

  async refund(id: string, adminId: string, reason: string): Promise<EscrowHold> {
    if (!reason || !reason.trim()) throw new BadRequestException('A refund reason is required');
    const hold = await this.requireOpen(id);
    hold.status = EscrowStatus.REFUNDED;
    hold.resolvedById = adminId;
    hold.refundReason = reason.trim();
    hold.refundedAt = new Date();
    return this.holds.save(hold);
  }

  private async requireOpen(id: string): Promise<EscrowHold> {
    const hold = await this.holds.findOne({ where: { id } });
    if (!hold) throw new NotFoundException('Escrow hold not found');
    if (CLOSED_STATUSES.includes(hold.status)) {
      throw new BadRequestException('Escrow hold is already settled');
    }
    return hold;
  }
}
