import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentGatewayService } from './payment-gateway.service';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentGatewayService, useValue: gateway },
        { provide: InvoiceService, useValue: invoiceService },
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
});
