import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminReportsController } from './admin-reports.controller';
import { Ticket } from '../tickets/ticket.entity';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';
import { EscrowHold } from '../escrow/entities/escrow-hold.entity';
import { SellerPayout } from '../seller/entities/seller-payout.entity';
import { SellerReview } from '../seller/entities/seller-review.entity';
import { Dispute } from '../trust/entities/dispute.entity';
import { User } from '../auth/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';
import { SellerReviewService } from '../seller/services/seller-review.service';
import { AdminMfaService } from '../admin-mfa/admin-mfa.service';

describe('AdminReportsController', () => {
  let controller: AdminReportsController;
  let reviewService: { reported: jest.Mock; decide: jest.Mock };
  const repos = {
    product: { findAndCount: jest.fn(), count: jest.fn() },
    bid: { findAndCount: jest.fn(), count: jest.fn() },
    seller: { findAndCount: jest.fn(), count: jest.fn() },
    invoice: { findAndCount: jest.fn(), find: jest.fn() },
    escrow: { find: jest.fn() },
    payout: { find: jest.fn() },
    user: { count: jest.fn() },
    room: { findAndCount: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [
        { provide: getRepositoryToken(Product), useValue: repos.product },
        { provide: getRepositoryToken(Bid), useValue: repos.bid },
        { provide: getRepositoryToken(Seller), useValue: repos.seller },
        { provide: getRepositoryToken(Invoice), useValue: repos.invoice },
        { provide: getRepositoryToken(EscrowHold), useValue: repos.escrow },
        { provide: getRepositoryToken(SellerPayout), useValue: repos.payout },
        { provide: getRepositoryToken(User), useValue: repos.user },
        { provide: getRepositoryToken(Room), useValue: repos.room },
        { provide: getRepositoryToken(Ticket), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(SellerReview), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Dispute), useValue: { find: jest.fn(), createQueryBuilder: jest.fn() } },
        {
          provide: DataSource,
          useValue: { getRepository: jest.fn() },
        },
        // The class-level guard resolves admin authority, which now includes the
        // second-factor requirement.
        {
          provide: AdminMfaService,
          useValue: { requirementFor: jest.fn().mockResolvedValue({ required: true, stepUpMinutes: 10 }) },
        },
        // Review moderation is delegated to the seller module's service.
        {
          provide: SellerReviewService,
          useValue: (reviewService = {
            reported: jest.fn().mockResolvedValue([]),
            decide: jest.fn().mockResolvedValue({ id: 'r1', status: 'HIDDEN' }),
          }),
        },
      ],
    }).compile();

    controller = module.get<AdminReportsController>(AdminReportsController);
    jest.clearAllMocks();
  });

  it('should return auction report with total', async () => {
    (repos.product.findAndCount as jest.Mock).mockResolvedValue([
      [{ id: 'p1' }],
      1,
    ]);
    const res = await controller.auctions();
    expect(res.success).toBe(true);
    expect(res.data.total).toBe(1);
    expect(repos.product.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('should filter auctions by status', async () => {
    (repos.product.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
    await controller.auctions('sold');
    expect(repos.product.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'sold' } }),
    );
  });

  it('should return bids report', async () => {
    (repos.bid.findAndCount as jest.Mock).mockResolvedValue([[{ id: 'b1' }], 1]);
    const res = await controller.bids();
    expect(res.data.total).toBe(1);
    expect(repos.bid.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['product', 'bidder'] }),
    );
  });

  it('should return sellers report', async () => {
    (repos.seller.findAndCount as jest.Mock).mockResolvedValue([[{ id: 's1' }], 1]);
    const res = await controller.sellers();
    expect(res.data.total).toBe(1);
  });

  it('should return payments (invoices) report', async () => {
    (repos.invoice.findAndCount as jest.Mock).mockResolvedValue([[{ id: 'i1' }], 1]);
    const res = await controller.payments();
    expect(res.data.total).toBe(1);
    expect(repos.invoice.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { issued_at: 'DESC' } }),
    );
  });

  it('lists every room for an admin (private ones included)', async () => {
    (repos.room.findAndCount as jest.Mock).mockResolvedValue([
      [{ id: 'r1', type: 'private' }],
      1,
    ]);

    const res = await controller.rooms();

    expect(res.data.total).toBe(1);
    expect(repos.room.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' } }),
    );
  });

  describe('money KPIs', () => {
    const paidInvoice = {
      status: 'paid',
      hammer_price: 100000,
      commission: 10000,
      seller_fee: 5000,
      fixed_fee: 0,
      other_charges: 0,
      vat: 1125,
      platform_share: 15000,
      total: 111125,
    };
    const issuedInvoice = { status: 'issued', total: 5000 };

    /** amount = sellerNet + platformShare + vatAmount */
    const reconciledHold = {
      amount: 111125,
      sellerNet: 95000,
      platformShare: 15000,
      vatAmount: 1125,
    };

    beforeEach(() => {
      (repos.invoice.find as jest.Mock).mockResolvedValue([paidInvoice, issuedInvoice]);
      (repos.escrow.find as jest.Mock).mockResolvedValue([reconciledHold]);
      (repos.payout.find as jest.Mock).mockResolvedValue([{ net_amount: 4000 }]);
      (repos.product.count as jest.Mock).mockResolvedValue(3);
      (repos.bid.count as jest.Mock).mockResolvedValue(7);
      (repos.user.count as jest.Mock).mockResolvedValue(5);
      (repos.seller.count as jest.Mock).mockResolvedValue(2);
    });

    it('reports GMV separately from revenue and VAT', async () => {
      const res = await controller.kpi();

      expect(res.data.gmv).toBe(100000); // hammer value only
      expect(res.data.platformRevenue).toBe(15000); // stored platform share
      expect(res.data.vatCollected).toBe(1125); // a liability, not income
      expect(res.data.buyerBilled).toBe(111125);
      expect(res.data.receivable).toBe(5000); // unpaid invoice total
      expect(res.data.invoicesPaid).toBe(1);
      expect(res.data.invoicesUnpaid).toBe(1);

      // Revenue + VAT must never be added into GMV by a consumer of this shape.
      expect(res.data.gmv).not.toBe(res.data.platformRevenue);
    });

    it('treats escrow float and in-flight payouts as liabilities', async () => {
      const res = await controller.kpi();

      expect(res.data.escrowFloat).toBe(111125);
      expect(res.data.escrowSellerNetHeld).toBe(95000);
      expect(res.data.escrowRevenueHeld).toBe(15000);
      expect(res.data.escrowVatHeld).toBe(1125);
      expect(res.data.payoutsInProgress).toBe(4000);
    });

    it('flags an escrow hold whose components do not add up', async () => {
      (repos.escrow.find as jest.Mock).mockResolvedValue([
        { ...reconciledHold, sellerNet: 1000 },
      ]);

      const res = await controller.kpi();

      expect(res.data.holdsOpen).toBe(1);
      expect(res.data.holdsNotReconciling).toBe(1);
    });

    it('carries the overview counters so the cards are exact totals', async () => {
      const res = await controller.kpi();

      expect(res.data).toMatchObject({
        activeAuctions: 3,
        totalBids: 7,
        totalBuyers: 5,
        pendingSellers: 2,
      });
    });
  });
});
