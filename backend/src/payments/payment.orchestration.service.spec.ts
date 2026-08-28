import { Test, TestingModule } from '@nestjs/testing';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { PaymentService } from './payment.service';
import { InvoiceService } from '../invoices/invoice.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';

describe('PaymentOrchestrationService', () => {
  let service: PaymentOrchestrationService;
  const paymentService = { create: jest.fn(), findByReference: jest.fn(), updateStatus: jest.fn(), listByUser: jest.fn() };
  const invoiceService = { markPaid: jest.fn() };
  const walletService = { deposit: jest.fn() };
  const rawKey = process.env.PAYSTACK_SECRET_KEY;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = 'test_key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentOrchestrationService,
        { provide: PaymentService, useValue: paymentService },
        { provide: InvoiceService, useValue: invoiceService },
        { provide: WalletService, useValue: walletService },
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
    expect(invoiceService.markPaid).not.toHaveBeenCalled();
    expect(walletService.deposit).not.toHaveBeenCalled();
  });

  it('marks an invoice paid on a valid succeeded invoice webhook', async () => {
    const { payload, headers, raw } = makeHook('REF', 'success');
    (paymentService.findByReference as jest.Mock).mockResolvedValue({
      id: 'p1', type: PaymentType.INVOICE, invoiceId: 'inv1',
      provider: PaymentProvider.PAYSTACK, reference: 'REF', status: PaymentStatus.PENDING,
    });
    (invoiceService.markPaid as jest.Mock).mockResolvedValue({ id: 'inv1' });
    (paymentService.updateStatus as jest.Mock).mockImplementation(async (_id, s, extra) => ({ id: 'p1', status: s, ...extra }));

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(invoiceService.markPaid).toHaveBeenCalledWith('inv1', expect.objectContaining({ paymentReference: 'REF' }));
    expect(paymentService.updateStatus).toHaveBeenCalledWith('p1', PaymentStatus.SUCCEEDED, expect.any(Object));
  });

  it('credits the wallet on a valid succeeded deposit webhook', async () => {
    const { payload, headers, raw } = makeHook('DEP', 'success');
    (paymentService.findByReference as jest.Mock).mockResolvedValue({
      id: 'p2', type: PaymentType.DEPOSIT, userId: 'u1', amount: 5000,
      provider: PaymentProvider.PAYSTACK, reference: 'DEP', status: PaymentStatus.PENDING,
    });
    (walletService.deposit as jest.Mock).mockResolvedValue({ balance: 5000 });
    (paymentService.updateStatus as jest.Mock).mockImplementation(async (_id, s, extra) => ({ id: 'p2', status: s, ...extra }));

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(walletService.deposit).toHaveBeenCalledWith('u1', expect.objectContaining({ amount: 5000, reference: 'DEP' }));
  });

  it('does not double-apply when a payment is already succeeded', async () => {
    const { payload, headers, raw } = makeHook('REF', 'success');
    (paymentService.findByReference as jest.Mock).mockResolvedValue({
      id: 'p1', type: PaymentType.INVOICE, invoiceId: 'inv1',
      provider: PaymentProvider.PAYSTACK, reference: 'REF', status: PaymentStatus.SUCCEEDED,
    });

    const res = await service.handleWebhook(PaymentProvider.PAYSTACK, payload, headers, raw);

    expect(res.success).toBe(true);
    expect(invoiceService.markPaid).not.toHaveBeenCalled();
  });
});
