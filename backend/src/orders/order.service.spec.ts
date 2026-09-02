import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './order.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { FeeService } from '../fees/fee.service';
import { InvoiceService } from '../invoices/invoice.service';
import { Product, AuctionType } from '../products/entities/product.entity';

describe('OrderService', () => {
  let service: OrderService;
  const orderRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const invoiceRepo = { findOne: jest.fn() };
  const productRepo = { findOne: jest.fn() };
  const feeService = { resolveAndCompute: jest.fn() };
  const invoiceService = { createInvoice: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity) =>
      entity === Order ? orderRepo : entity === Product ? productRepo : invoiceRepo,
    ),
  };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };

  const paidInvoice = {
    id: 'inv1', invoice_number: 'INV-1', auction_id: 'a1', product_id: 'p1',
    buyer_id: 'b1', seller_id: 's1', total: '1000.00', status: InvoiceStatus.PAID, payment_reference: 'REF-1',
  };
  const issuedInvoice = { ...paidInvoice, id: 'inv2', status: InvoiceStatus.ISSUED, payment_reference: null };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: FeeService, useValue: feeService },
        { provide: InvoiceService, useValue: invoiceService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
  });

  it('creates a PAID order from a paid invoice (idempotent per invoice)', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(paidInvoice);
    (orderRepo.findOne as jest.Mock).mockResolvedValue(null);
    (orderRepo.create as jest.Mock).mockImplementation((x: any) => x);
    (orderRepo.save as jest.Mock).mockImplementation(async (x: any) => ({ id: 'o1', ...x }));

    const res = await service.createFromInvoice('inv1', 'b1');

    expect(invoiceRepo.findOne).toHaveBeenCalledWith({ where: { id: 'inv1' }, lock: { mode: 'pessimistic_write' } });
    expect(res.status).toBe(OrderStatus.PAID);
    expect(res.invoiceId).toBe('inv1');
    expect(res.buyerId).toBe('b1');
    expect(res.sellerId).toBe('s1');
    expect(res.total).toBe(1000);
    expect(res.paymentReference).toBe('REF-1');
  });

  it('creates a PENDING order from an issued (unpaid) invoice', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(issuedInvoice);
    (orderRepo.findOne as jest.Mock).mockResolvedValue(null);
    (orderRepo.create as jest.Mock).mockImplementation((x: any) => x);
    (orderRepo.save as jest.Mock).mockImplementation(async (x: any) => ({ id: 'o2', ...x }));

    const res = await service.createFromInvoice('inv2', 'b1');
    expect(res.status).toBe(OrderStatus.PENDING);
    expect(res.paymentReference).toBeNull();
  });

  it('is idempotent — returns the existing order without creating a second one', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(paidInvoice);
    (orderRepo.findOne as jest.Mock).mockResolvedValue({ id: 'o1', invoiceId: 'inv1' });

    const res = await service.createFromInvoice('inv1', 'b1');
    expect(res.id).toBe('o1');
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('rejects an invoice that belongs to another buyer', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({ ...paidInvoice, buyer_id: 'someone-else' });
    await expect(service.createFromInvoice('inv1', 'b1')).rejects.toThrow(ForbiddenException);
  });

  it('rejects a cancelled invoice', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({ ...paidInvoice, status: InvoiceStatus.CANCELLED });
    await expect(service.createFromInvoice('inv1', 'b1')).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound for an unknown invoice', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.createFromInvoice('nope', 'b1')).rejects.toThrow(NotFoundException);
  });

  it('marks an existing pending order paid in the caller transaction', async () => {
    const pending = { id: 'o1', invoiceId: 'inv1', status: OrderStatus.PENDING, paymentReference: null };
    (orderRepo.findOne as jest.Mock).mockResolvedValue(pending);
    (orderRepo.save as jest.Mock).mockImplementation(async (x: any) => x);

    const res = await service.markPaidInManager(manager as any, 'inv1', 'REF-9');
    expect(res.status).toBe(OrderStatus.PAID);
    expect(res.paymentReference).toBe('REF-9');
    expect(orderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('creates a paid order in the caller transaction when none exists yet (webhook seam)', async () => {
    (orderRepo.findOne as jest.Mock).mockResolvedValue(null);
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(paidInvoice);
    (orderRepo.create as jest.Mock).mockImplementation((x: any) => x);
    (orderRepo.save as jest.Mock).mockImplementation(async (x: any) => ({ id: 'o-w', ...x }));

    const res = await service.markPaidInManager(manager as any, 'inv1', 'REF-9');
    expect(res.status).toBe(OrderStatus.PAID);
    expect(res.paymentReference).toBe('REF-9');
    expect(res.invoiceId).toBe('inv1');
  });

  it('findById rejects a viewer who is neither buyer nor seller', async () => {
    (orderRepo.findOne as jest.Mock).mockResolvedValue({ id: 'o1', buyerId: 'b1', sellerId: 's1' });
    await expect(service.findById('o1', 'stranger')).rejects.toThrow(ForbiddenException);
    const own = await service.findById('o1', 's1');
    expect(own.id).toBe('o1');
  });

  it('listByUser returns orders where the user is buyer or seller', async () => {
    (orderRepo.find as jest.Mock).mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]);
    const res = await service.listByUser('u1');
    expect(res).toHaveLength(2);
    expect(orderRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: [{ buyerId: 'u1' }, { sellerId: 'u1' }] }),
    );
  });

  describe('createForBuyNow (U5 #7 — fees on direct sales)', () => {
    const directLot = {
      id: 'p9',
      auctionType: AuctionType.DIRECT_SALE,
      allowBuyNow: true,
      buyNowPrice: '20000.00',
      category: 'art',
      sellerId: 's1',
      escrowReleaseHours: 0,
    } as any;

    beforeEach(() => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(directLot);
      (feeService.resolveAndCompute as jest.Mock).mockResolvedValue({
        bidAmount: 20000,
        buyerFee: 1000,
        sellerFee: 1000,
        vatOnBid: 1500,
        vatOnBuyerFee: 75,
        otherCharges: 0,
        fixedFee: 0,
        total: 22575,
        sellerNet: 19000,
        vatBase: 'hammer_and_fees',
        source: 'default',
      });
      (invoiceRepo.findOne as jest.Mock).mockResolvedValue(null);
      (invoiceService.createInvoice as jest.Mock).mockResolvedValue({
        id: 'inv9', invoice_number: 'INV-2026-000009', auction_id: 'p9',
        product_id: 'p9', buyer_id: 'b1', seller_id: 's1',
        hammer_price: '20000.00', commission: '1000.00', vat: '1575.00',
        fixed_fee: '0.00', total: '22575.00', status: InvoiceStatus.ISSUED,
        payment_reference: null,
      });
      (orderRepo.create as jest.Mock).mockImplementation((x: any) => x);
      (orderRepo.save as jest.Mock).mockImplementation(async (x: any) => ({ id: 'o9', ...x }));
    });

    it('issues an invoice from the buy-now price with the resolved fees', async () => {
      const res = await service.createForBuyNow('p9', 'b1');
      expect(feeService.resolveAndCompute).toHaveBeenCalledWith(
        20000,
        expect.objectContaining({ category: 'art', sellerId: 's1', productId: 'p9' }),
      );
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        manager,
        expect.objectContaining({
          hammerPrice: 20000,
          commission: 1000,
          sellerFee: 1000,
          escrowWindowHours: 0,
        }),
      );
      expect(res.total).toBe(22575);
    });

    it('rejects a lot that is not a direct sale', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        ...directLot,
        auctionType: AuctionType.OPEN_AUCTION,
      });
      await expect(service.createForBuyNow('p9', 'b1')).rejects.toThrow(BadRequestException);
    });

    it('rejects a second buyer while an invoice is already open', async () => {
      (invoiceRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'inv8', buyer_id: 'someone-else', status: InvoiceStatus.ISSUED,
      });
      await expect(service.createForBuyNow('p9', 'b1')).rejects.toThrow(BadRequestException);
    });
  });
});
