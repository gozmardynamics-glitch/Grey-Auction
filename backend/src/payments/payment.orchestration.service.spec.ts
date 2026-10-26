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
  const paymentService = { create: jest.fn(), findByReference: jest.fn(), updateStatus: jest.fn(), listByUser: jest.fn(), findLiveForInvoice: jest.fn() };
  const invoiceService = { markPaidInManager: jest.fn(), findById: jest.fn(), findLiveForInvoice: jest.fn() };
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

  describe('NGN-only checkout', () => {
    const invoice = (currency: string) => ({
      id: 'inv1',
      buyer_id: 'u1',
      status: 'issued',
      total: '118250',
      currency,
    });

    it('refuses a non-NGN invoice instead of charging it through an NGN gateway', async () => {
      (invoiceService.findById as jest.Mock).mockResolvedValue(invoice('USD'));
      (paymentService.findLiveForInvoice as jest.Mock).mockResolvedValue(null);

      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.PAYSTACK,
          invoiceId: 'inv1',
        } as any),
      ).rejects.toThrow(/limited to NGN/);

      // Nothing may be persisted for a refused charge.
      expect(paymentService.create).not.toHaveBeenCalled();
    });

    it('accepts an NGN invoice (the normal path)', async () => {
      (invoiceService.findById as jest.Mock).mockResolvedValue(invoice('NGN'));
      (paymentService.findLiveForInvoice as jest.Mock).mockResolvedValue(null);
      (paymentService.create as jest.Mock).mockResolvedValue({ id: 'p1', reference: 'PAY-X', status: 'pending' });

      // The provider is not configured in the test env, so the adapter call is
      // allowed to fail — the point is that the currency gate did not refuse it.
      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.PAYSTACK,
          invoiceId: 'inv1',
        } as any),
      ).rejects.not.toThrow(/limited to NGN/);
    });

    it('refuses a non-NGN wallet top-up', async () => {
      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.DEPOSIT,
          provider: PaymentProvider.PAYSTACK,
          amount: 5000,
          currency: 'USD',
        } as any),
      ).rejects.toThrow(/NGN-only/);
      expect(paymentService.create).not.toHaveBeenCalled();
    });
  });

  describe('provider allow-list', () => {
    const rawDisabled = process.env.PAYMENT_PROVIDERS_DISABLED;
    afterEach(() => {
      if (rawDisabled === undefined) delete process.env.PAYMENT_PROVIDERS_DISABLED;
      else process.env.PAYMENT_PROVIDERS_DISABLED = rawDisabled;
    });

    const ngnInvoice = () => ({
      id: 'inv1',
      buyer_id: 'u1',
      status: 'issued',
      total: '118250',
      currency: 'NGN',
    });

    it('refuses a provider an operator switched off, persisting nothing', async () => {
      process.env.PAYMENT_PROVIDERS_DISABLED = 'opay,interswitch';
      (invoiceService.findById as jest.Mock).mockResolvedValue(ngnInvoice());

      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.OPAY,
          invoiceId: 'inv1',
        } as any),
      ).rejects.toThrow(/temporarily unavailable/);

      expect(paymentService.create).not.toHaveBeenCalled();
    });

    it('ignores spacing and casing in the disabled list', async () => {
      process.env.PAYMENT_PROVIDERS_DISABLED = ' OPay , Interswitch ';
      (invoiceService.findById as jest.Mock).mockResolvedValue(ngnInvoice());

      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.INTERSWITCH,
          invoiceId: 'inv1',
        } as any),
      ).rejects.toThrow(/temporarily unavailable/);
    });

    it('still reaches the adapter for an enabled provider', async () => {
      process.env.PAYMENT_PROVIDERS_DISABLED = 'opay,interswitch';
      (invoiceService.findById as jest.Mock).mockResolvedValue(ngnInvoice());
      (paymentService.findLiveForInvoice as jest.Mock).mockResolvedValue(null);
      (paymentService.create as jest.Mock).mockResolvedValue({ id: 'p1', reference: 'PAY-X' });

      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.PAYSTACK,
          invoiceId: 'inv1',
        } as any),
      ).rejects.not.toThrow(/temporarily unavailable/);
    });

    it('refuses an unconfigured provider instead of pinning the invoice to a dead payment', async () => {
      // No FLUTTERWAVE_SECRET_KEY in this suite, so it cannot take money.
      process.env.PAYMENT_PROVIDERS_DISABLED = '';
      delete process.env.FLUTTERWAVE_SECRET_KEY;
      (invoiceService.findById as jest.Mock).mockResolvedValue(ngnInvoice());
      (paymentService.findLiveForInvoice as jest.Mock).mockResolvedValue(null);

      await expect(
        service.initialize({
          userId: 'u1',
          type: PaymentType.INVOICE,
          provider: PaymentProvider.FLUTTERWAVE,
          invoiceId: 'inv1',
        } as any),
      ).rejects.toThrow(/not available right now/);

      // Nothing may be persisted: an in-flight payment would block a retry.
      expect(paymentService.create).not.toHaveBeenCalled();
    });

    it('reports availability separately from configuration', () => {
      process.env.PAYMENT_PROVIDERS_DISABLED = 'opay';
      const status = service.providersStatus();
      const opay = status.find((p) => p.provider === PaymentProvider.OPAY);
      const paystack = status.find((p) => p.provider === PaymentProvider.PAYSTACK);

      expect(opay).toMatchObject({ available: false });
      // Paystack has a key in this suite, so it is both configured and offered.
      expect(paystack).toMatchObject({ configured: true, available: true });
    });

    it('never offers an unconfigured provider even when it is not switched off', () => {
      process.env.PAYMENT_PROVIDERS_DISABLED = '';
      const flutterwave = service
        .providersStatus()
        .find((p) => p.provider === PaymentProvider.FLUTTERWAVE);

      expect(flutterwave).toMatchObject({ configured: false, available: false });
    });
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
