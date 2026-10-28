import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import {
  Ticket,
  TicketCategory,
  TicketClosureReason,
  TicketMessage,
  TicketOutcome,
  TicketSeverity,
  TicketSource,
  TicketStatus,
} from './ticket.entity';
import { TicketSlaService } from './ticket-sla.service';
import { EmailService } from '../common/email/email.service';

export interface CreateTicketInput {
  subject: string;
  description?: string;
  category?: TicketCategory | string;
  severity?: TicketSeverity | string;
  source?: TicketSource | string;
  userId: string;
  userName?: string;
  userEmail?: string;
}

export interface TicketFilters {
  status?: string;
  category?: string;
  severity?: string;
  overdue?: boolean;
}

/** A ticket as the admin queue sees it: the row plus its live SLA state. */
export type TicketView = Ticket & { sla: ReturnType<TicketSlaService['view']> };

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket) private readonly repo: Repository<Ticket>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sla: TicketSlaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(filters: TicketFilters = {}): Promise<TicketView[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;

    const rows = await this.repo.find({
      where,
      // Soonest deadline first: the queue is a work list, not an archive.
      order: { dueAt: 'ASC', createdAt: 'DESC' },
      take: 200,
    });
    const views = rows.map((ticket) => Object.assign(ticket, { sla: this.sla.view(ticket) }));
    return filters.overdue ? views.filter((ticket) => ticket.sla.state === 'overdue') : views;
  }

  findAllByUser(userId: string): Promise<Ticket[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  /** SLA projection for one row, for the owner-facing endpoints. */
  viewFor(ticket: Ticket) {
    return this.sla.view(ticket);
  }

  findByReference(reference: string) {
    return this.repo.findOne({ where: { reference } });
  }

  /**
   * Open a complaint.
   *
   * Classification and the service-level clocks are set here, not by the caller:
   * a ticket that does not know its category cannot be triaged, and one with no
   * deadline cannot be monitored. The acknowledgement email is what turns the
   * published "we will acknowledge within 2 business days" into a fact — it also
   * gives the complainant the reference the policy promises.
   */
  async create(input: CreateTicketInput): Promise<Ticket & { sla: ReturnType<TicketSlaService['view']> }> {
    const category = this.normaliseCategory(input.category);
    const severity =
      (this.normaliseSeverity(input.severity) as TicketSeverity | null) ?? this.sla.severityFor(category);
    const now = new Date();
    const { acknowledgedBy, dueAt } = this.sla.schedule(severity, now);

    const saved = await this.dataSource.transaction(async (manager) => {
      const reference = await this.nextReference(manager, now);
      const ticket = manager.getRepository(Ticket).create({
        reference,
        subject: input.subject,
        description: input.description,
        category,
        severity,
        source: this.normaliseSource(input.source),
        status: TicketStatus.OPEN,
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        messages: [],
        acknowledgedAt: now,
        dueAt,
      });
      return manager.getRepository(Ticket).save(ticket);
    });

    await this.sendAcknowledgement(saved, acknowledgedBy).catch((error) => {
      this.logger.warn(`Acknowledgement email failed for ${saved.reference}: ${error.message}`);
    });

    return Object.assign(saved, { sla: this.sla.view(saved) });
  }

  /**
   * Add a reply. A staff reply starts the first-response clock and moves the
   * ticket to in-progress; the account holder's own messages never do.
   */
  async sendMessage(
    id: string,
    senderId: string,
    content: string,
    options: { staff?: boolean } = {},
  ): Promise<Ticket | null> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) return null;

    const messages = (ticket.messages || []) as TicketMessage[];
    const staff = options.staff ?? senderId !== ticket.userId;
    messages.push({
      senderId,
      content,
      timestamp: new Date().toISOString(),
      ...(staff && { staff: true }),
    });

    const patch: Partial<Ticket> = { messages };
    if (staff) {
      if (!ticket.firstResponseAt) {
        patch.firstResponseAt = new Date();
        patch.firstResponderId = senderId;
      }
      if (ticket.status === TicketStatus.OPEN) patch.status = TicketStatus.IN_PROGRESS;
    }

    await this.repo.update(id, patch);
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Move a ticket to its final state.
   *
   * A resolution must say what the outcome was, and a close must say why: a
   * complaint that ends without either cannot be reported on, and "vexatious"
   * closures in particular must be on the record.
   */
  async setStatus(
    id: string,
    input: { status: TicketStatus; outcome?: TicketOutcome; closureReason?: TicketClosureReason; note?: string },
  ): Promise<Ticket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const status = input.status;
    if (!Object.values(TicketStatus).includes(status)) {
      throw new BadRequestException(`Unknown status: ${status}`);
    }
    if (status === TicketStatus.RESOLVED && !input.outcome) {
      throw new BadRequestException('A resolved complaint must record its outcome');
    }
    if (status === TicketStatus.CLOSED && !input.closureReason) {
      throw new BadRequestException('A closed complaint must record why it was closed');
    }

    ticket.status = status;
    if (input.outcome) ticket.outcome = input.outcome;
    if (input.closureReason) ticket.closureReason = input.closureReason;
    if (input.note !== undefined) ticket.resolutionNote = input.note;
    if (status === TicketStatus.RESOLVED && !ticket.firstResponseAt) {
      // Resolving without any earlier reply still counts as having responded.
      ticket.firstResponseAt = new Date();
    }
    return this.repo.save(ticket);
  }

  /**
   * Internal review: someone senior who was not the first responder.
   *
   * The policy promises independence, so the rule is enforced rather than
   * trusted — escalating to yourself is refused.
   */
  async escalate(
    id: string,
    input: { toAdminId?: string; note?: string },
  ): Promise<Ticket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (input.toAdminId && ticket.firstResponderId && input.toAdminId === ticket.firstResponderId) {
      throw new BadRequestException(
        'An internal review must be handled by someone other than the first responder',
      );
    }
    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('A closed complaint cannot be escalated');
    }

    ticket.escalatedAt = new Date();
    ticket.escalatedToId = input.toAdminId ?? null;
    if (input.note) {
      const messages = (ticket.messages || []) as TicketMessage[];
      messages.push({
        senderId: input.toAdminId ?? 'system',
        content: `[Escalated for internal review] ${input.note}`,
        timestamp: new Date().toISOString(),
        staff: true,
      });
      ticket.messages = messages;
    }
    return this.repo.save(ticket);
  }

  /** Counts for the admin dashboard: what is due, what is late. */
  async slaSummary(): Promise<{
    open: number;
    overdue: number;
    dueSoon: number;
    unacknowledged: number;
    unresponded: number;
    dataProtectionOpen: number;
    dataProtectionOverdue: number;
    byCategory: Record<string, number>;
  }> {
    const rows = await this.repo.find({
      where: { status: Not(In([TicketStatus.RESOLVED, TicketStatus.CLOSED])) },
      take: 1000,
    });
    const byCategory: Record<string, number> = {};
    let overdue = 0;
    let dueSoon = 0;
    let unacknowledged = 0;
    let unresponded = 0;
    let dataProtectionOpen = 0;
    let dataProtectionOverdue = 0;

    for (const ticket of rows) {
      const view = this.sla.view(ticket);
      if (view.state === 'overdue') overdue += 1;
      if (view.state === 'due_soon') dueSoon += 1;
      if (!view.acknowledged) unacknowledged += 1;
      if (!view.firstResponded) unresponded += 1;
      byCategory[ticket.category] = (byCategory[ticket.category] || 0) + 1;
      if (ticket.category === TicketCategory.DATA_PROTECTION) {
        dataProtectionOpen += 1;
        if ((view.statutoryDaysLeft ?? 1) < 0) dataProtectionOverdue += 1;
      }
    }

    return {
      open: rows.length,
      overdue,
      dueSoon,
      unacknowledged,
      unresponded,
      dataProtectionOpen,
      dataProtectionOverdue,
      byCategory,
    };
  }

  /**
   * Compliance with the published promises, over resolved and open tickets.
   * Used by the monthly complaints review.
   */
  async performance(): Promise<{
    total: number;
    acknowledgedWithinSla: number;
    respondedWithinSla: number;
    byOutcome: Record<string, number>;
    byClosureReason: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const rows = await this.repo.find({ take: 2000, order: { createdAt: 'DESC' } });
    const byOutcome: Record<string, number> = {};
    const byClosureReason: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let acknowledgedWithinSla = 0;
    let respondedWithinSla = 0;

    for (const ticket of rows) {
      bySeverity[ticket.severity] = (bySeverity[ticket.severity] || 0) + 1;
      if (ticket.outcome) byOutcome[ticket.outcome] = (byOutcome[ticket.outcome] || 0) + 1;
      if (ticket.closureReason) {
        byClosureReason[ticket.closureReason] = (byClosureReason[ticket.closureReason] || 0) + 1;
      }
      if (ticket.acknowledgedAt) {
        const hours = (ticket.acknowledgedAt.getTime() - ticket.createdAt.getTime()) / 3_600_000;
        if (hours <= 48) acknowledgedWithinSla += 1;
      }
      if (ticket.firstResponseAt && ticket.dueAt) {
        if (ticket.firstResponseAt.getTime() <= ticket.dueAt.getTime()) respondedWithinSla += 1;
      }
    }

    return {
      total: rows.length,
      acknowledgedWithinSla,
      respondedWithinSla,
      byOutcome,
      byClosureReason,
      bySeverity,
    };
  }

  /** Tickets that have slipped past their deadline and not yet been chased. */
  findSlipping(now = new Date(), limit = 100): Promise<Ticket[]> {
    return this.repo
      .createQueryBuilder('t')
      .where('t.status IN (:...open)', { open: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] })
      .andWhere('t."dueAt" IS NOT NULL')
      .andWhere('t."dueAt" < :now', { now })
      .andWhere('t."slaNotifiedAt" IS NULL')
      .orderBy('t."dueAt"', 'ASC')
      .take(limit)
      .getMany();
  }

  async markSlaNotified(id: string): Promise<void> {
    await this.repo.update(id, { slaNotifiedAt: new Date() });
  }

  /** Reference allocation is serialized so two simultaneous complaints cannot collide. */
  private async nextReference(manager: EntityManager, now: Date): Promise<string> {
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext('greyauction_ticket_reference')::bigint)`);
    const count = await manager.getRepository(Ticket).count();
    return this.sla.reference(count + 1, now);
  }

  private normaliseCategory(value: TicketCategory | string | undefined): TicketCategory {
    const raw = String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
    const match = Object.values(TicketCategory).find((category) => category === raw);
    return match ?? TicketCategory.OTHER;
  }

  private normaliseSeverity(value: TicketSeverity | string | undefined): TicketSeverity | null {
    const raw = String(value || '').toLowerCase();
    const match = Object.values(TicketSeverity).find((severity) => severity === raw);
    return match ?? null;
  }

  private normaliseSource(value: TicketSource | string | undefined): TicketSource {
    const raw = String(value || '').toLowerCase();
    const match = Object.values(TicketSource).find((source) => source === raw);
    return match ?? TicketSource.DASHBOARD;
  }

  private async sendAcknowledgement(ticket: Ticket, acknowledgedBy: Date): Promise<void> {
    if (!ticket.userEmail) return;
    const due = ticket.dueAt
      ? new Date(ticket.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'a date we will confirm shortly';

    await this.emailService.sendEmail({
      to: ticket.userEmail,
      subject: `We have your complaint — ${ticket.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#f8f8f8;">
          <h2 style="color:#1a1a2e;margin:0 0 12px;">We have received your complaint</h2>
          <p style="color:#333;line-height:1.6;">Thank you for telling us. Your reference is
            <strong style="font-family:monospace;">${ticket.reference}</strong>. Quote it in any reply and it will reach the same case.</p>
          <p style="color:#333;line-height:1.6;">We aim to give you a substantive response by
            <strong>${due}</strong>. If that date changes we will tell you before it passes, not after.</p>
          <p style="color:#333;line-height:1.6;">You can follow the case, and reply to it, from your dashboard.</p>
          <p style="color:#666;font-size:12px;line-height:1.6;">If this is about a purchase, you can also open a dispute on the
            purchase itself — that freezes the funds in escrow while we investigate.</p>
        </div>`,
    });
  }
}
