import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentOrchestrationService } from './payment.orchestration.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  const orchestration = {
    initialize: jest.fn(),
    handleWebhook: jest.fn(),
    providersStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentOrchestrationService, useValue: orchestration }],
    }).compile();
    controller = module.get<PaymentController>(PaymentController);
  });

  it('providers returns the orchestration provider status', async () => {
    (orchestration.providersStatus as jest.Mock).mockReturnValue([
      { provider: 'paystack', configured: true },
      { provider: 'opay', configured: false },
    ]);
    const res = await controller.providers();
    expect(res.data).toHaveLength(2);
    expect(orchestration.providersStatus).toHaveBeenCalled();
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
