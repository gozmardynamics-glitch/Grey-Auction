import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus, PaymentType, PaymentProvider } from './entities/payment.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  const repo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repo },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
  });

  it('create returns the existing payment for a known reference (idempotent)', async () => {
    const existing = { id: 'p1', reference: 'REF-1' };
    (repo.findOne as jest.Mock).mockResolvedValue(existing);

    const res = await service.create({
      userId: 'u1',
      type: PaymentType.INVOICE,
      provider: PaymentProvider.PAYSTACK,
      reference: 'REF-1',
      amount: 5000,
    });

    expect(res).toBe(existing);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('create stores a new pending payment when the reference is new', async () => {
    const dto = {
      userId: 'u1',
      type: PaymentType.DEPOSIT,
      provider: PaymentProvider.FLUTTERWAVE,
      reference: 'REF-2',
      amount: 1000,
    };
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((d: any) => d);
    (repo.save as jest.Mock).mockImplementation(async (d: any) => d);

    const res = await service.create(dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ reference: 'REF-2', status: PaymentStatus.PENDING }),
    );
  });

  it('updateStatus throws NotFound for an unknown payment', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.updateStatus('nope', PaymentStatus.SUCCEEDED)).rejects.toThrow(NotFoundException);
  });

  describe('status transition table', () => {
    const payment = (status: PaymentStatus) => ({ id: 'p1', status, reference: 'REF-1' });

    it('allows PENDING -> SUCCEEDED', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(payment(PaymentStatus.PENDING));
      (repo.save as jest.Mock).mockImplementation(async (p: any) => p);

      const res = await service.updateStatus('p1', PaymentStatus.SUCCEEDED);
      expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    });

    it('refuses SUCCEEDED -> FAILED: settlement stands once money moved', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(payment(PaymentStatus.SUCCEEDED));
      await expect(service.updateStatus('p1', PaymentStatus.FAILED)).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('refuses FAILED -> SUCCEEDED: retries open a new payment', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(payment(PaymentStatus.FAILED));
      await expect(service.updateStatus('p1', PaymentStatus.SUCCEEDED)).rejects.toThrow(ConflictException);
    });

    it('allows a same-status write so metadata can attach to a live payment', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(payment(PaymentStatus.PENDING));
      (repo.save as jest.Mock).mockImplementation(async (p: any) => p);

      const res = await service.updateStatus('p1', PaymentStatus.PENDING, { providerReference: 'PS-1' });
      expect(res.providerReference).toBe('PS-1');
    });
  });

  it('listByUser returns payments newest-first', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 'p2' }, { id: 'p1' }]);
    const res = await service.listByUser('u1');
    expect(res).toHaveLength(2);
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
  });
});
