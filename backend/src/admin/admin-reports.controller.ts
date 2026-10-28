import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { EscrowHold, EscrowStatus } from '../escrow/entities/escrow-hold.entity';
import { SellerPayout, PayoutStatus } from '../seller/entities/seller-payout.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller, SellerVerificationStatus } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';
import { Ticket, TicketStatus } from '../tickets/ticket.entity';
import { SellerReview, ReviewStatus } from '../seller/entities/seller-review.entity';
import { Dispute } from '../trust/entities/dispute.entity';
import { USER_PUBLIC_SELECT } from '../common/projections/user-projection';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { AdminRole } from './entities/admin.entity';

const ALL_ADMIN_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.PLATFORM_ADMIN,
  AdminRole.FINANCE_ADMIN,
  AdminRole.SUPPORT_ADMIN,
];

/**
 * Admin report/overview endpoints that power the admin dashboards.
 * Guarded by JWT + admin role resolution (any admin role may read reports).
 */
@ApiTags('Admin Reports')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(...ALL_ADMIN_ROLES)
@ApiBearerAuth()
export class AdminReportsController {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(EscrowHold) private readonly escrowRepo: Repository<EscrowHold>,
    @InjectRepository(SellerPayout) private readonly payoutRepo: Repository<SellerPayout>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(SellerReview) private readonly reviewRepo: Repository<SellerReview>,
    @InjectRepository(Dispute) private readonly disputeRepo: Repository<Dispute>,
  ) {}

  /**
   * Money KPIs, with the accounting distinctions made explicit.
   *
   * GMV is the hammer value and is NOT revenue: the platform is an agent holding
   * client money. Revenue is what the platform keeps (the stored `platform_share`
   * — buyer premium + seller fee + other + fixed), and VAT is a liability
   * collected on someone else's behalf. A dashboard that shows GMV as revenue
   * drives wrong decisions, so they are separate fields and the labels say so.
   *
   * Every figure is summed from stored columns. Recomputing a share from an
   * assumed rate is how a dashboard starts disagreeing with the invoices it
   * summarises.
   */
  @Get('kpi')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: money KPIs (GMV is not revenue)' })
  async kpi() {
    const invoices = await this.invoiceRepo.find();

    const status = (invoice: Invoice) => String(invoice.status).toLowerCase();
    const paid = invoices.filter((invoice) => status(invoice) === 'paid');
    const unpaid = invoices.filter((invoice) => status(invoice) === 'issued');

    const sum = <T>(rows: T[], pick: (row: T) => unknown) =>
      rows.reduce((total, row) => total + Number(pick(row) || 0), 0);
    const money = (value: number) => Math.round(value * 100) / 100;

    // Escrow float is client money: it sits in the platform's account but
    // belongs to a buyer until the hold is released or refunded.
    const openHolds = await this.escrowRepo.find({
      where: { status: In([EscrowStatus.HELD, EscrowStatus.DISPUTED]) },
    });

    const openPayouts = await this.payoutRepo.find({
      where: { status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]) },
    });

    // Control: every hold must split exactly into seller + platform + VAT.
    // A non-reconciling hold means money will move to the wrong party.
    const holdsNotReconciling = openHolds.filter((hold) => {
      const parts =
        Number(hold.sellerNet || 0) +
        Number(hold.platformShare || 0) +
        Number(hold.vatAmount || 0);
      return Math.abs(parts - Number(hold.amount || 0)) > 0.01;
    }).length;

    // Counting rows (not sampling one page) so the dashboard shows totals.
    const [activeAuctions, totalBids, totalBuyers, pendingSellers] = await Promise.all([
      this.productRepo.count({ where: { status: ProductStatus.ACTIVE } }),
      this.bidRepo.count(),
      this.userRepo.count({ where: { role: UserRole.BIDDER } }),
      this.sellerRepo.count({
        where: {
          verification_status: In([
            SellerVerificationStatus.PENDING,
            SellerVerificationStatus.UNDER_REVIEW,
          ]),
        },
      }),
    ]);

    return {
      success: true,
      data: {
        currency: 'NGN',

        // ── Volume, not income ──────────────────────────────────────────
        gmv: money(sum(paid, (i) => i.hammer_price)),
        invoicesPaid: paid.length,
        invoicesTotal: invoices.length,

        // ── Income (platform's own money) ───────────────────────────────
        platformRevenue: money(sum(paid, (i) => i.platform_share)),
        buyerPremium: money(sum(paid, (i) => i.commission)),
        sellerCommission: money(sum(paid, (i) => i.seller_fee)),

        // ── Liability to the tax authority ──────────────────────────────
        vatCollected: money(sum(paid, (i) => i.vat)),

        // ── What buyers were billed / still owe ─────────────────────────
        buyerBilled: money(sum(paid, (i) => i.total)),
        receivable: money(sum(unpaid, (i) => i.total)),
        invoicesUnpaid: unpaid.length,

        // ── Client money and money owed out ─────────────────────────────
        escrowFloat: money(sum(openHolds, (h) => h.amount)),
        escrowSellerNetHeld: money(sum(openHolds, (h) => h.sellerNet)),
        escrowRevenueHeld: money(sum(openHolds, (h) => h.platformShare)),
        escrowVatHeld: money(sum(openHolds, (h) => h.vatAmount)),
        payoutsInProgress: money(sum(openPayouts, (p) => p.net_amount)),
        payoutsPending: openPayouts.length,

        // ── Controls ────────────────────────────────────────────────────
        holdsOpen: openHolds.length,
        holdsNotReconciling,

        // ── Volume counters for the overview cards ──────────────────────
        activeAuctions,
        totalBids,
        totalBuyers,
        pendingSellers,
      },
    };
  }

  /**
   * Complaint register: one row per complaint, for the monthly review.
   *
   * The policy promises we learn from complaints as a group. That needs an
   * export, not a screen — this is the source for "how many, how fast, what did
   * we decide". `format=csv` returns a file an accountant or a regulator can
   * open; the default JSON is for the dashboard.
   */
  @Get('complaints/register')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Complaint register (admin) — JSON or CSV' })
  async complaintsRegister(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    const qb = this.ticketRepo.createQueryBuilder('t').orderBy('t."createdAt"', 'DESC').take(2000);
    if (from) qb.andWhere('t."createdAt" >= :from', { from: new Date(from) });
    if (to) qb.andWhere('t."createdAt" <= :to', { to: new Date(to) });
    const rows = await qb.getMany();

    // Disputes are the other half of the complaint picture — a dispute *is* a
    // complaint with money attached — so the register joins them rather than
    // leaving an export that only counts half the cases.
    const disputeQb = this.disputeRepo
      .createQueryBuilder('d')
      .orderBy('d."createdAt"', 'DESC')
      .take(2000);
    if (from) disputeQb.andWhere('d."createdAt" >= :from', { from: new Date(from) });
    if (to) disputeQb.andWhere('d."createdAt" <= :to', { to: new Date(to) });
    const disputes = await disputeQb.getMany();

    const complaintRecords = rows.map((ticket) => ({
      reference: ticket.reference,
      raised_at: ticket.createdAt?.toISOString() ?? '',
      category: ticket.category,
      severity: ticket.severity,
      source: ticket.source,
      status: ticket.status,
      escalated_at: ticket.escalatedAt?.toISOString() ?? '',
      first_response_at: ticket.firstResponseAt?.toISOString() ?? '',
      due_at: ticket.dueAt?.toISOString() ?? '',
      outcome: ticket.outcome ?? '',
      closure_reason: ticket.closureReason ?? '',
      resolution: ticket.resolutionNote ?? '',
      subject: ticket.subject,
    }));

    const disputeRecords = disputes.map((dispute) => ({
      kind: 'dispute',
      reference: dispute.id.slice(0, 8).toUpperCase(),
      raised_at: dispute.createdAt?.toISOString() ?? '',
      category: dispute.reason,
      severity: 'p1',
      source: 'dispute',
      status: dispute.status,
      escalated_at: dispute.appealedAt?.toISOString() ?? '',
      first_response_at: dispute.resolvedAt?.toISOString() ?? '',
      due_at: '',
      outcome: dispute.status === 'resolved' ? 'upheld' : dispute.status === 'rejected' ? 'not_upheld' : '',
      closure_reason: '',
      resolution: dispute.resolution ?? '',
      subject: `Dispute: ${dispute.reason.replace(/_/g, ' ')}`,
    }));

    const records = [
      ...complaintRecords.map((record) => ({ kind: 'complaint', ...record })),
      ...disputeRecords,
    ].sort((a, b) => String(b.raised_at).localeCompare(String(a.raised_at)));

    const summary = {
      total: records.length,
      complaints: complaintRecords.length,
      disputes: disputeRecords.length,
      open: records.filter((r) => r.status !== TicketStatus.RESOLVED && r.status !== TicketStatus.CLOSED).length,
      byCategory: records.reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {}),
      byOutcome: records.reduce<Record<string, number>>((acc, r) => {
        if (r.outcome) acc[r.outcome] = (acc[r.outcome] || 0) + 1;
        return acc;
      }, {}),
    };

    if (String(format).toLowerCase() === 'csv') {
      const columns = Object.keys(records[0] ?? {
        reference: '', raised_at: '', category: '', severity: '', source: '', status: '',
        escalated_at: '', first_response_at: '', due_at: '', outcome: '', closure_reason: '',
        resolution: '', subject: '',
      });
      const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = [
        columns.join(','),
        ...records.map((record) => columns.map((column) => escape((record as never)[column])).join(',')),
      ].join('\n');
      // Returned as a string body; the caller saves it. Keeps this dependency-free.
      return { success: true, format: 'csv', filename: `complaints-${new Date().toISOString().slice(0, 10)}.csv`, csv, summary };
    }

    return { success: true, data: { summary, records } };
  }

  /**
   * Reviews a user has reported. Without this, "flag the review" absorbed the
   * complaint silently: the flag was stored and nobody ever looked at it.
   */
  @Get('reviews/flagged')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Reviews awaiting moderation (admin)' })
  async flaggedReviews() {
    const data = await this.reviewRepo.find({
      where: { status: ReviewStatus.FLAGGED },
      order: { flagged_at: 'DESC' },
      take: 200,
    });
    return { success: true, data };
  }

  /**
   * Decide a reported review: `hide` keeps it for the record but off the profile,
   * `remove` takes it down, `restore` rejects the report. Hiding rather than
   * deleting is the default in a dispute, because the review is evidence.
   */
  @Patch('reviews/:id/decision')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Act on a reported review (admin)' })
  async decideReview(@Param('id') id: string, @Body() body: { action: 'hide' | 'remove' | 'restore' }) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const action = String(body?.action || '').toLowerCase();
    if (!['hide', 'remove', 'restore'].includes(action)) {
      throw new BadRequestException('action must be hide, remove or restore');
    }

    if (action === 'hide') review.status = ReviewStatus.HIDDEN;
    if (action === 'remove') {
      review.status = ReviewStatus.REMOVED;
      review.deleted_at = new Date();
    }
    if (action === 'restore') {
      review.status = ReviewStatus.ACTIVE;
      review.flag_reason = null;
      review.flagged_by_id = null;
      review.flagged_at = null;
    }

    return { success: true, data: await this.reviewRepo.save(review) };
  }

  @Get('auctions')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: all auctions (products)' })
  async auctions(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.productRepo.findAndCount({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('bids')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: recent bids' })
  async bids(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.bidRepo.findAndCount({
      relations: ['product', 'bidder'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('sellers')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: all sellers' })
  async sellers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.sellerRepo.findAndCount({
      order: { id: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('payments')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: invoices / payments' })
  async payments(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.invoiceRepo.findAndCount({
      order: { issued_at: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  /**
   * Every bidding room, public and private.
   *
   * The public `/rooms` listing is deliberately public-rooms-only; an
   * administrator still has to be able to review the private ones, so the full
   * set lives behind the admin guard instead of being leaked to everyone.
   */
  @Get('rooms')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: all bidding rooms' })
  async rooms(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.roomRepo.findAndCount({
      relations: ['createdBy'],
      select: { createdBy: USER_PUBLIC_SELECT },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }
}
