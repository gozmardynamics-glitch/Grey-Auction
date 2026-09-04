import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { PaymentService } from './payment.service';
import { InvoiceService } from '../invoices/invoice.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';
import { OrderService } from '../orders/order.service';
import { EscrowService } from '../escrow/escrow.service';
import { PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';

describe('PaymentOrchestrationService', () => {
  let service: PaymentOrchestrationService;
  const paymentService = { create: jest.fn(), findByReference: jest.fn(), updateStatus: jest.fn(), listByUser: jest.fn() };
  const invoiceService = { markPaidInManager: jest.fn() };
  const walletService = { creditInManager: jest.fn() };
  const orderService = { markPaidInManager: jest.fn() };
  const escrowService = { holdInManager: jest.fn() };
  const paymentRepo = { findOne: jest.fn(), save: jest.fn() };
  const manager = { getRepository: jest.fn(() => paymentRepo) };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };
  const rawKey = process.env.PAYSTACK_SECRET_KEY;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = 'test_key';
    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(manager));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentOrchestrationService,
        { provide: PaymentService, useValue: paymentService },
        { provide: InvoiceService, useValue: invoiceService },
        { provide: WalletService, useValue: walletService },
        { provide: OrderService, useValue: orderService },
        { provide: EscrowService, useValue: escrowService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<PaymentOrchestrationService>(PaymentOrchestrationService);
  });
  afterEach(() => {
    process.env.PAYSTACK_SECRET_KEY = rawKey;
  });

  function makeHook(reference: string, status: string) {
    const { createHmac } = require('crypto');
    const raw = JSON.stringify({ event: 'charge.success', data: { reference, amount: 500000 } });
    const sig = createHmac('sha512', 'test_key').update(raw).digest('hex');
    return { payload: JSON.parse(raw), headers: { 'x-paystack-signature': sig }, raw };
  }

  it('rejects a webhook with an invalid signature (no outcome applied)', async () => {
    const res = await service.handleWebhook(
      PaymentProvider.PAYSTACK,
      { event: 'charge.success', data: { reference: 'REF' } },
      { 'x-paystack-signature': 'wrong' },
      JSON.stringify({ event: 'charge.success', data: { reference: 'REF' } }),
    );
    expect(res.success).toBe(false);
    expect(invoiceService.markPaidInManager).not.toHaveBeenCalled();
    expect(walletService.creditInManager).not.toHaveBeenCalled();
    expect(orderService.markPaidInManager).not.toHaveBeenCalled();
    expect(escrowService.holdInManager).not.toHaveBeenCalled();
  });

  it('marks an invoice paid and flips the payment atomically on a valid succeeded webhook', async () => {
    const { payload, headers, raw } = makeHook('REF', 'success');
    const payment = {
      id: 'p1', type: PaymentType.INVOICE, invoiceId: 'inv1', amount: 5000,
      provider: PaymentProvider.PAYSTACK, reference: 'REF', status: PaymentStatus.PENDING, providerReference: null,
    };
    (paymentService.findByReference as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.findOne as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.save as jest.Mock).mockImplementation(async (x: any) => x);
    (invoiceService.markPaidInManager as jest.Mock).mockResolvedValue({ id: 'inv1' });
    (orderService.markPaidInManager as jest.Mock).mockResolvedValue({ id: 'o1', status: 'paid' });

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(res.payment.status).toBe(PaymentStatus.SUCCEEDED);
    expect(invoiceService.markPaidInManager).toHaveBeenCalledWith(
      manager, 'inv1', expect.objectContaining({ paymentReference: 'REF', paymentMethod: PaymentProvider.PAYSTACK }),
    );
    // D3: the order is created/marked paid atomically with the invoice.
    expect(orderService.markPaidInManager).toHaveBeenCalledWith(manager, 'inv1', 'REF');
    // U5 #4: the escrow hold is placed atomically with payment success.
    expect(escrowService.holdInManager).toHaveBeenCalledWith(manager,
      expect.objectContaining({ invoiceId: 'inv1' }),
    );
  });

  it('credits the wallet on a valid succeeded deposit webhook', async () => {
    const { payload, headers, raw } = makeHook('DEP', 'success');
    const payment = {
      id: 'p2', type: PaymentType.DEPOSIT, userId: 'u1', amount: 5000,
      provider: PaymentProvider.PAYSTACK, reference: 'DEP', status: PaymentStatus.PENDING, providerReference: null,
    };
    (paymentService.findByReference as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.findOne as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.save as jest.Mock).mockImplementation(async (x: any) => x);
    (walletService.creditInManager as jest.Mock).mockResolvedValue({ balance: 5000 });

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(res.payment.status).toBe(PaymentStatus.SUCCEEDED);
    expect(orderService.markPaidInManager).not.toHaveBeenCalled();
    expect(escrowService.holdInManager).not.toHaveBeenCalled();
    expect(walletService.creditInManager).toHaveBeenCalledWith(
      manager, 'u1', expect.objectContaining({ amount: 5000, reference: 'DEP', type: WalletTransactionType.DEPOSIT }),
    );
  });

  it('does not double-apply when a payment is already succeeded', async () => {
    const { payload, headers, raw } = makeHook('REF', 'success');
    const payment = {
      id: 'p1', type: PaymentType.INVOICE, invoiceId: 'inv1', amount: 5000,
      provider: PaymentProvider.PAYSTACK, reference: 'REF', status: PaymentStatus.SUCCEEDED, providerReference: null,
    };
    (paymentService.findByReference as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.findOne as jest.Mock).mockResolvedValue(payment);

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(invoiceService.markPaidInManager).not.toHaveBeenCalled();
    expect(orderService.markPaidInManager).not.toHaveBeenCalled();
  });

  it('refuses to settle a succeeded webhook whose amount mismatches the app payment', async () => {
    // hook amount 500000 kobo = 5000 naira; the app payment claims 4999.99.
    const { payload, headers, raw } = makeHook('REF', 'success');
    const payment = {
      id: 'p3', type: PaymentType.INVOICE, invoiceId: 'inv1', amount: 4999.99,
      provider: PaymentProvider.PAYSTACK, reference: 'REF', status: PaymentStatus.PENDING, providerReference: null,
    };
    (paymentService.findByReference as jest.Mock).mockResolvedValue(payment);
    (paymentRepo.findOne as jest.Mock).mockResolvedValue(payment);

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(false);
    expect(invoiceService.markPaidInManager).not.toHaveBeenCalled();
    expect(orderService.markPaidInManager).not.toHaveBeenCalled();
    expect(escrowService.holdInManager).not.toHaveBeenCalled();
    expect(paymentService.updateStatus).not.toHaveBeenCalled();
  });
});
