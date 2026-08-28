import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { InvoiceService } from '../invoices/invoice.service';

describe('PaymentController webhook', () => {
  let controller: PaymentController;
  const gateway = {
    verifyPayment: jest.fn(),
    isConfigured: jest.fn(),
  };
  const invoiceService = {
    findByPaymentReference: jest.fn(),
    markPaid: jest.fn(),
    findAll: jest.fn(),
  };
  const orchestration = {
    initialize: jest.fn(),
    handleWebhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentGatewayService, useValue: gateway },
        { provide: InvoiceService, useValue: invoiceService },
        { provide: PaymentOrchestrationService, useValue: orchestration },
      ],
    }).compile();
    controller = module.get<PaymentController>(PaymentController);
  });

  it('does NOT auto-verify or mark paid when the gateway is in mock mode', async () => {
    (gateway.isConfigured as jest.Mock).mockReturnValue(false);
    const res = await controller.webhook('', '', {
      data: { tx_ref: 'REF-1' },
    });
    expect(gateway.verifyPayment).not.toHaveBeenCalled();
    expect(invoiceService.findByPaymentReference).not.toHaveBeenCalled();
    expect(invoiceService.markPaid).not.toHaveBeenCalled();
    expect(res.data.verified).toBe(false);
  });

  it('verifies and marks paid via targeted lookup when a provider is configured', async () => {
    (gateway.isConfigured as jest.Mock).mockReturnValue(true);
    (gateway.verifyPayment as jest.Mock).mockResolvedValue({
      verified: true,
      reference: 'REF-1',
      message: 'Payment verified',
    });
    (invoiceService.findByPaymentReference as jest.Mock).mockResolvedValue({
      id: 'inv-1',
    });
    (invoiceService.markPaid as jest.Mock).mockResolvedValue({ id: 'inv-1' });

    const res = await controller.webhook('sig', '', {
      data: { tx_ref: 'REF-1', payment_type: 'card' },
    });

    expect(gateway.verifyPayment).toHaveBeenCalledWith('REF-1', 'sig');
    expect(invoiceService.findByPaymentReference).toHaveBeenCalledWith('REF-1');
    expect(invoiceService.markPaid).toHaveBeenCalledWith('inv-1', {
      paymentMethod: 'card',
      paymentReference: 'REF-1',
    });
    expect(res.data.verified).toBe(true);
  });

  it('returns no-reference response when body lacks a reference', async () => {
    const res = await controller.webhook('', '', {});
    expect(res.data.verified).toBe(false);
    expect(res.data.message).toContain('No reference');
  });

  it('init delegates to the orchestration with the buyer-chosen provider + type', async () => {
    (orchestration.initialize as jest.Mock).mockResolvedValue({ payment: { id: 'p1' } });
    const res = await controller.init(
      { type: 'invoice', provider: 'paystack', amount: 5000, invoiceId: 'inv1' } as any,
      { user: { id: 'u1', email: 'a@b.com' } },
    );
    expect(orchestration.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'invoice', provider: 'paystack', amount: 5000, invoiceId: 'inv1', email: 'a@b.com' }),
    );
    expect(res.data.payment).toEqual({ id: 'p1' });
  });

  it('providerWebhook delegates to the orchestration handler', async () => {
    const body = { event: 'charge.success', data: { reference: 'REF' } };
    (orchestration.handleWebhook as jest.Mock).mockResolvedValue({ success: true });
    const res = await controller.providerWebhook(
      'paystack',
      { 'x-paystack-signature': 'sig' },
      body,
      { rawBody: Buffer.from(JSON.stringify(body)) },
    );
    expect(orchestration.handleWebhook).toHaveBeenCalledWith(
      'paystack',
      body,
      { 'x-paystack-signature': 'sig' },
      JSON.stringify(body),
    );
    expect(res.success).toBe(true);
  });

  it('providerWebhook rejects an unknown provider', async () => {
    await expect(controller.providerWebhook('nope', {}, {}, {})).rejects.toThrow(BadRequestException);
  });
});
