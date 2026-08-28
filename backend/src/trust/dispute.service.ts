import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Dispute,
  DisputeStatus,
  DisputeFeedback,
} from './entities/dispute.entity';
import { Product } from '../products/entities/product.entity';
import { CreateDisputeDto, ResolveDisputeDto, DisputeFeedbackDto } from './dto/trust.dto';

const ACTIVE_STATUSES = [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW];
const CLOSED_STATUSES = [DisputeStatus.RESOLVED, DisputeStatus.REJECTED];

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputes: Repository<Dispute>,
    @InjectRepository(DisputeFeedback)
    private readonly feedback: Repository<DisputeFeedback>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  /** Buyer (or seller) opens a case. One active dispute per user per lot. */
  async open(dto: CreateDisputeDto, user: { id: string }) {
    if (dto.productId) {
      const product = await this.products.findOne({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Product not found');
      const existing = await this.disputes.findOne({
        where: { productId: dto.productId, openedById: user.id, status: In(ACTIVE_STATUSES) },
      });
      if (existing) {
        throw new ConflictException('You already have an open dispute for this lot');
      }
      if (!dto.againstUserId && product.sellerId !== user.id) {
        // Default the respondent to the counterparty (the seller).
        dto = { ...dto, againstUserId: product.sellerId };
      }
    }
    const dispute = this.disputes.create({
      openedById: user.id,
      againstUserId: dto.againstUserId ?? null,
      productId: dto.productId ?? null,
      invoiceId: dto.invoiceId ?? null,
      reason: dto.reason,
      description: dto.description,
      status: DisputeStatus.OPEN,
    });
    return this.disputes.save(dispute);
  }

  /** Disputes I opened or that were opened against me. */
  async listForUser(userId: string): Promise<Dispute[]> {
    return this.disputes.find({
      where: [{ openedById: userId }, { againstUserId: userId }],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getOne(id: string, user: { id: string; role?: string }): Promise<Dispute> {
    const dispute = await this.disputes.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    const party = dispute.openedById === user.id || dispute.againstUserId === user.id;
    if (!party && user.role !== 'admin') throw new ForbiddenException('Not a party to this dispute');
    return dispute;
  }

  /** Admin queue. */
  async adminList(status?: DisputeStatus): Promise<Dispute[]> {
    return this.disputes.find({
      where: status ? { status } : {},
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  /** Admin moves OPEN -> UNDER_REVIEW (or back to OPEN). */
  async setStatus(id: string, status: DisputeStatus) {
    const dispute = await this.disputes.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (CLOSED_STATUSES.includes(dispute.status)) {
      throw new BadRequestException('Closed disputes cannot be reopened');
    }
    if (CLOSED_STATUSES.includes(status)) {
      throw new BadRequestException('Use the resolve endpoint to close a dispute');
    }
    dispute.status = status;
    return this.disputes.save(dispute);
  }

  /** Admin closes the case with an outcome + written resolution. */
  async resolve(id: string, adminUser: { id: string }, dto: ResolveDisputeDto) {
    const dispute = await this.disputes.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (CLOSED_STATUSES.includes(dispute.status)) {
      throw new BadRequestException('Dispute is already closed');
    }
    dispute.status = dto.outcome;
    dispute.resolution = dto.resolution;
    dispute.resolvedById = adminUser.id;
    dispute.resolvedAt = new Date();
    return this.disputes.save(dispute);
  }

  /** Feedback loop: parties rate the outcome once the case is closed. */
  async addFeedback(id: string, user: { id: string }, dto: DisputeFeedbackDto) {
    const dispute = await this.disputes.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    const isParty = dispute.openedById === user.id || dispute.againstUserId === user.id;
    if (!isParty) throw new ForbiddenException('Only the parties can leave feedback');
    if (!CLOSED_STATUSES.includes(dispute.status)) {
      throw new BadRequestException('Feedback is available once the dispute is closed');
    }
    const existing = await this.feedback.findOne({ where: { disputeId: id, userId: user.id } });
    if (existing) throw new ConflictException('You already left feedback for this dispute');

    const fb = this.feedback.create({
      disputeId: id,
      userId: user.id,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    return this.feedback.save(fb);
  }

  async feedbackFor(id: string): Promise<DisputeFeedback[]> {
    return this.feedback.find({ where: { disputeId: id }, order: { createdAt: 'ASC' } });
  }
}
