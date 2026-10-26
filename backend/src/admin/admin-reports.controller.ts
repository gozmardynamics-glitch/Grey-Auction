import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
