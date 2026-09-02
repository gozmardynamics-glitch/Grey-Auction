import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
  const notifications = { notifyAuctionWon: jest.fn().mockResolvedValue(undefined), notifyAuctionEnded: jest.fn().mockResolvedValue(undefined) };
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
});
