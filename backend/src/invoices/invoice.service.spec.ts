import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { EmailService } from '../common/email/email.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  const invoiceRepo = { findOne: jest.fn(), save: jest.fn(), count: jest.fn(), create: jest.fn(), find: jest.fn() };
  const userRepo = { findOne: jest.fn() };
  const productRepo = { findOne: jest.fn() };
  const emailService = { sendReceiptEmail: jest.fn(), sendInvoiceEmail: jest.fn() };
  const manager = { getRepository: jest.fn(() => invoiceRepo), query: jest.fn(async () => []) };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: EmailService, useValue: emailService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<InvoiceService>(InvoiceService);
  });

  it('marks an invoice paid inside a transaction with a pessimistic lock', async () => {
    const invoice = { id: 'inv1', status: InvoiceStatus.ISSUED, buyer_id: 'b1', total: 1000, invoice_number: 'INV-1' };
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(invoice);
    (invoiceRepo.save as jest.Mock).mockImplementation(async (x: any) => x);
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    const res = await service.markPaid('inv1', { paymentMethod: 'card', paymentReference: 'REF' });

    expect(res.status).toBe(InvoiceStatus.PAID);
    expect(invoiceRepo.findOne).toHaveBeenCalledWith({ where: { id: 'inv1' }, lock: { mode: 'pessimistic_write' } });
    expect(invoiceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: InvoiceStatus.PAID, payment_reference: 'REF', payment_method: 'card' }),
    );
  });

  it('is idempotent for an already-paid invoice (webhook replays)', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({ id: 'inv1', status: InvoiceStatus.PAID });
    const res = await service.markPaid('inv1', {});
    expect(res.status).toBe(InvoiceStatus.PAID);
    expect(invoiceRepo.save).not.toHaveBeenCalled();
  });

  it('rejects paying a cancelled invoice', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({ id: 'inv1', status: InvoiceStatus.CANCELLED });
    await expect(service.markPaid('inv1', {})).rejects.toThrow(BadRequestException);
  });

  it('rejects an unknown invoice', async () => {
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.markPaid('nope', {})).rejects.toThrow(NotFoundException);
  });

  it('issues an invoice inside a transaction (settlement seam)', async () => {
    (invoiceRepo.count as jest.Mock).mockResolvedValue(5);
    (invoiceRepo.create as jest.Mock).mockImplementation((x: any) => x);
    (invoiceRepo.save as jest.Mock).mockImplementation(async (x: any) => ({ id: 'inv1', ...x }));
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    const res = await service.generateInvoice({
      auctionId: 'a1', productId: 'p1', buyerId: 'b1', sellerId: 's1',
      hammerPrice: 1000, commission: 100, vat: 75, fixedFee: 50,
    });

    expect(res.invoice_number).toMatch(/^INV-\d{4}-000006$/);
    expect(res.total).toBe(1225);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
