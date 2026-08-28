import { Test, TestingModule } from '@nestjs/testing';
import { PaymentReconciliationService } from './payment.reconciliation.service';
import { PaymentService } from './payment.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';

describe('PaymentReconciliationService', () => {
  let service: PaymentReconciliationService;
  const paymentService = { findPending: jest.fn() };
  const orchestration = { reconcilePayment: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentReconciliationService,
        { provide: PaymentService, useValue: paymentService },
        { provide: PaymentOrchestrationService, useValue: orchestration },
      ],
    }).compile();
    service = module.get<PaymentReconciliationService>(PaymentReconciliationService);
  });

  it('sweep reconciles each stale pending payment through the orchestration', async () => {
    const pending = [{ id: 'p1', reference: 'REF', status: 'pending' }, { id: 'p2', reference: 'REF2', status: 'pending' }];
    (paymentService.findPending as jest.Mock).mockResolvedValue(pending);
    (orchestration.reconcilePayment as jest.Mock).mockResolvedValue({ id: 'p1', status: 'succeeded' });

    await service.sweep();

    expect(paymentService.findPending).toHaveBeenCalled();
    expect(orchestration.reconcilePayment).toHaveBeenCalledTimes(2);
    expect(orchestration.reconcilePayment).toHaveBeenCalledWith(pending[0]);
  });

  it('sweep does nothing when there are no stale payments', async () => {
    (paymentService.findPending as jest.Mock).mockResolvedValue([]);
    await service.sweep();
    expect(orchestration.reconcilePayment).not.toHaveBeenCalled();
  });
});
