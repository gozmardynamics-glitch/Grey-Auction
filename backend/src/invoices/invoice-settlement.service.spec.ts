import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InvoiceSettlementService } from './invoice-settlement.service';
import { InvoiceService } from './invoice.service';
import { FeeService } from '../fees/fee.service';
import { NotificationService } from '../notification/notification.service';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';

describe('InvoiceSettlementService', () => {
  let service: InvoiceSettlementService;
  const productRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const bidRepo = { findOne: jest.fn() };
  const feeService = { getBreakdown: jest.fn(), resolveAndCompute: jest.fn() };
  const invoiceService = { createInvoice: jest.fn() };
  const notifications = {
    notifyAuctionWon: jest.fn().mockResolvedValue(undefined),
    notifyAuctionEnded: jest.fn().mockResolvedValue(undefined),
    notifySellerApprovalRequested: jest.fn().mockResolvedValue(undefined),
    notifySaleDeclined: jest.fn().mockResolvedValue(undefined),
  };
  const manager = {
    getRepository: jest.fn((entity) => (entity === Product ? productRepo : bidRepo)),
  };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceSettlementService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Bid), useValue: bidRepo },
        { provide: FeeService, useValue: feeService },
        { provide: InvoiceService, useValue: invoiceService },
        { provide: NotificationService, useValue: notifications },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<InvoiceSettlementService>(InvoiceSettlementService);
  });

  it('issues an invoice and marks the lot SOLD atomically', async () => {
    const ended = { id: 'p1', title: 'Watch', slug: 'watch', category: 'luxury', sellerId: 's1', status: ProductStatus.ACTIVE };
    (productRepo.find as jest.Mock).mockResolvedValue([ended]);
    (productRepo.findOne as jest.Mock).mockResolvedValue(ended);
    (bidRepo.findOne as jest.Mock).mockResolvedValue({ bidderId: 'b1', amount: 100000 });
    (feeService.resolveAndCompute as jest.Mock).mockResolvedValue({
      bidAmount: 100000,
      buyerFee: 5000,
      sellerFee: 5000,
      vatOnBid: 7500,
      vatOnBuyerFee: 375,
      otherCharges: 0,
      fixedFee: 1000,
      total: 113875,
      sellerNet: 95000,
      vatBase: 'hammer_and_fees',
      source: 'seller',
    });
    (invoiceService.createInvoice as jest.Mock).mockResolvedValue({ id: 'inv1' });
    (productRepo.save as jest.Mock).mockImplementation(async (x: any) => x);

    const res = await service.settleEndedAuctions();

    expect(res.settled).toBe(1);
    expect(res.skipped).toBe(0);
    expect(res.errors).toBe(0);
    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: 'p1' }, lock: { mode: 'pessimistic_write' } });
    expect(feeService.resolveAndCompute).toHaveBeenCalledWith(
      100000,
      expect.objectContaining({ category: 'luxury', sellerId: 's1', productId: 'p1' }),
    );
    // U5: buyer fee + seller fee + provenance + escrow window on the invoice
    expect(invoiceService.createInvoice).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        auctionId: 'p1',
        buyerId: 'b1',
        sellerId: 's1',
        commission: 5000,
        sellerFee: 5000,
        feeSource: 'seller',
        vatBase: 'hammer_and_fees',
        escrowWindowHours: 72,
      }),
    );
    expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: ProductStatus.SOLD }));
    expect(notifications.notifyAuctionWon).toHaveBeenCalled();
    expect(notifications.notifyAuctionEnded).toHaveBeenCalled();
  });

  it('closes an ended lot with no winning bid', async () => {
    const ended = { id: 'p2', title: 'Art', slug: 'art', category: 'art', sellerId: 's2', status: ProductStatus.APPROVED };
    (productRepo.find as jest.Mock).mockResolvedValue([ended]);
    (productRepo.findOne as jest.Mock).mockResolvedValue(ended);
    (bidRepo.findOne as jest.Mock).mockResolvedValue(null);
    (productRepo.save as jest.Mock).mockImplementation(async (x: any) => x);

    const res = await service.settleEndedAuctions();

    expect(res.settled).toBe(0);
    expect(res.skipped).toBe(1);
    expect(invoiceService.createInvoice).not.toHaveBeenCalled();
    expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: ProductStatus.CLOSED }));
  });

  it('skips a lot that was already settled by a concurrent run', async () => {
    const ended = { id: 'p3', title: 'Car', slug: 'car', category: 'motors', sellerId: 's3', status: ProductStatus.ACTIVE };
    (productRepo.find as jest.Mock).mockResolvedValue([ended]);
    (productRepo.findOne as jest.Mock).mockResolvedValue({ ...ended, status: ProductStatus.SOLD });

    const res = await service.settleEndedAuctions();

    expect(res.settled).toBe(0);
    expect(res.skipped).toBe(1);
    expect(invoiceService.createInvoice).not.toHaveBeenCalled();
  });

  describe('Decision 3b — winning bid subject to seller approval', () => {
    const breakdown = {
      bidAmount: 100000, buyerFee: 5000, sellerFee: 5000,
      vatOnBid: 7500, vatOnBuyerFee: 375, otherCharges: 0, fixedFee: 0,
      total: 112875, sellerNet: 95000, vatBase: 'hammer_and_fees', source: 'default',
    };
    const mockInvoice = () => {
      (feeService.resolveAndCompute as jest.Mock).mockResolvedValue(breakdown);
      (invoiceService.createInvoice as jest.Mock).mockResolvedValue({ id: 'inv9' });
      (productRepo.save as jest.Mock).mockImplementation(async (x: any) => x);
    };

    it('parks a below-threshold winner in AWAITING_SELLER_APPROVAL and asks the seller', async () => {
      const ended = {
        id: 'p4', title: 'Vase', slug: 'vase', category: 'art', sellerId: 's4',
        status: ProductStatus.ACTIVE,
        requiresSellerApproval: true, approvalThreshold: 50000,
      };
      (productRepo.find as jest.Mock).mockResolvedValue([ended]);
      (productRepo.findOne as jest.Mock).mockResolvedValue(ended);
      (bidRepo.findOne as jest.Mock).mockResolvedValue({ bidderId: 'b4', amount: 40000 });

      const res = await service.settleEndedAuctions();

      expect(res.settled).toBe(0);
      expect(res.skipped).toBe(1);
      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProductStatus.AWAITING_SELLER_APPROVAL }),
      );
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
      expect(notifications.notifySellerApprovalRequested).toHaveBeenCalledWith(
        's4', expect.objectContaining({ auctionId: 'p4', hammerPrice: 40000 }),
      );
      expect(notifications.notifyAuctionWon).not.toHaveBeenCalled();
    });

    it('auto-settles a winner at or above the approval threshold', async () => {
      const ended = {
        id: 'p5', title: 'Ring', slug: 'ring', category: 'luxury', sellerId: 's5',
        status: ProductStatus.ACTIVE,
        requiresSellerApproval: true, approvalThreshold: 50000,
      };
      (productRepo.find as jest.Mock).mockResolvedValue([ended]);
      (productRepo.findOne as jest.Mock).mockResolvedValue(ended);
      (bidRepo.findOne as jest.Mock).mockResolvedValue({ bidderId: 'b5', amount: 60000 });
      mockInvoice();

      const res = await service.settleEndedAuctions();

      expect(res.settled).toBe(1);
      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProductStatus.SOLD }),
      );
      expect(invoiceService.createInvoice).toHaveBeenCalled();
    });

    it('accept issues the invoice at decision time and marks the lot SOLD', async () => {
      const parked = {
        id: 'p6', title: 'Map', slug: 'map', category: 'art', sellerId: 'owner-1',
        status: ProductStatus.AWAITING_SELLER_APPROVAL, escrowReleaseHours: 72,
      };
      (productRepo.findOne as jest.Mock).mockResolvedValue(parked);
      (bidRepo.findOne as jest.Mock).mockResolvedValue({ bidderId: 'b6', amount: 42000 });
      mockInvoice();

      const res = await service.decideSale('p6', 'owner-1', 'accept');

      expect(res.status).toBe(ProductStatus.SOLD);
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        manager,
        expect.objectContaining({ buyerId: 'b6', hammerPrice: 42000 }),
      );
      expect(notifications.notifyAuctionWon).toHaveBeenCalledWith(
        'b6', expect.objectContaining({ auctionId: 'p6' }),
      );
    });

    it('decline closes the lot unsold and tells the buyer no payment is owed', async () => {
      const parked = {
        id: 'p7', title: 'Clock', slug: 'clock', category: 'antiques', sellerId: 'owner-1',
        status: ProductStatus.AWAITING_SELLER_APPROVAL,
      };
      (productRepo.findOne as jest.Mock).mockResolvedValue(parked);
      (bidRepo.findOne as jest.Mock).mockResolvedValue({ bidderId: 'b7', amount: 30000 });
      (productRepo.save as jest.Mock).mockImplementation(async (x: any) => x);

      const res = await service.decideSale('p7', 'owner-1', 'decline');

      expect(res.status).toBe(ProductStatus.CLOSED);
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
      expect(notifications.notifySaleDeclined).toHaveBeenCalledWith(
        'b7', expect.objectContaining({ auctionId: 'p7' }),
      );
    });

    it('refuses a decision from anyone but the owner', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'p8', sellerId: 'real-owner', status: ProductStatus.AWAITING_SELLER_APPROVAL,
      });
      await expect(service.decideSale('p8', 'impostor', 'accept')).rejects.toThrow(ForbiddenException);
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
    });

    it('refuses a decision on a lot that is not awaiting approval', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'p9', sellerId: 'owner-1', status: ProductStatus.ACTIVE,
      });
      await expect(service.decideSale('p9', 'owner-1', 'accept')).rejects.toThrow(BadRequestException);
    });
  });
});
