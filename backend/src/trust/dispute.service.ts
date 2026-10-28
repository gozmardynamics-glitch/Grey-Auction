import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Dispute,
  DisputeStatus,
  DisputeFeedback,
} from './entities/dispute.entity';
import { Product } from '../products/entities/product.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import { CreateDisputeDto, ResolveDisputeDto, DisputeFeedbackDto } from './dto/trust.dto';

const ACTIVE_STATUSES = [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW];
const CLOSED_STATUSES = [DisputeStatus.RESOLVED, DisputeStatus.REJECTED];

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);
  constructor(
    @InjectRepository(Dispute)
    private readonly disputes: Repository<Dispute>,
    @InjectRepository(DisputeFeedback)
    private readonly feedback: Repository<DisputeFeedback>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly notifications: NotificationService,
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
  /**
   * Appeal a decided dispute, once.
   *
   * Reopening rather than creating a second case keeps the evidence, the
   * messages and the money in one place. Only a party may appeal, only a decided
   * dispute can be appealed, and only once — otherwise "review" becomes a loop.
   */
  async appeal(id: string, user: { id: string }, reason: string) {
    const dispute = await this.disputes.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const isParty = dispute.openedById === user.id || dispute.againstUserId === user.id;
    if (!isParty) throw new ForbiddenException('Not a party to this dispute');
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Say why you are appealing so the reviewer can act on it');
    }
    if (!CLOSED_STATUSES.includes(dispute.status)) {
      throw new BadRequestException('Only a decided dispute can be appealed');
    }
    if ((dispute.appealCount || 0) >= 1) {
      throw new BadRequestException('This dispute has already been appealed once');
    }

    const previousResolver = dispute.resolvedById;

    dispute.status = DisputeStatus.UNDER_REVIEW;
    dispute.appealCount = (dispute.appealCount || 0) + 1;
    dispute.appealedAt = new Date();
    dispute.appealReason = reason.trim();
    // Clear the decision so the reviewer is not anchored by the previous outcome;
    // it stays in the record via appealReason and the audit trail.
    dispute.resolution = null;
    dispute.resolvedById = null;
    dispute.resolvedAt = null;

    const saved = await this.disputes.save(dispute);

    // A reopened case is only visible if someone is told. The other party needs
    // to know a decision they were given is back under review; the resolver (if
    // any) needs to know their call is being questioned.
    const link = '/buyer/dashboard?tab=disputes';
    const recipients = new Set<string>();
    if (dispute.openedById && dispute.openedById !== user.id) recipients.add(dispute.openedById);
    if (dispute.againstUserId && dispute.againstUserId !== user.id) recipients.add(dispute.againstUserId);
    for (const userId of recipients) {
      await this.notifications
        .create(userId, {
          type: NotificationType.DISPUTE_APPEALED,
          title: 'A dispute was appealed',
          body: 'The other party disputed the outcome. It is back under review with a different reviewer.',
          link,
        })
        .catch((error) =>
          // The appeal is already committed; a failed notice must not undo it,
          // but it must be visible rather than silently dropped.
          this.logger.warn(`Appeal notification failed for ${userId}: ${error.message}`),
        );
    }
    if (previousResolver && previousResolver !== user.id) {
      await this.notifications
        .create(previousResolver, {
          type: NotificationType.DISPUTE_APPEALED,
          title: 'Your dispute decision was appealed',
          body: `The decision on dispute ${dispute.id.slice(0, 8)} is being reviewed by someone else.`,
          link: '/admin/dashboard',
        })
        .catch((error) =>
          this.logger.warn(`Appeal notification to the resolver failed: ${error.message}`),
        );
    }

    return saved;
  }

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
