import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { Dispute, DisputeStatus, DisputeFeedback, DisputeReason } from './entities/dispute.entity';
import { Product } from '../products/entities/product.entity';

describe('DisputeService', () => {
  let service: DisputeService;
  const disputes = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
  const feedback = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
  const products = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        { provide: getRepositoryToken(Dispute), useValue: disputes },
        { provide: getRepositoryToken(DisputeFeedback), useValue: feedback },
        { provide: getRepositoryToken(Product), useValue: products },
      ],
    }).compile();
    service = module.get<DisputeService>(DisputeService);
  });

  const openDto = { reason: DisputeReason.NOT_AS_DESCRIBED, description: 'Lot differs from photos', productId: 'p1' };

  it('opens a dispute and defaults the respondent to the seller', async () => {
    (products.findOne as jest.Mock).mockResolvedValue({ id: 'p1', sellerId: 'seller1' });
    (disputes.findOne as jest.Mock).mockResolvedValue(null);
    (disputes.create as jest.Mock).mockImplementation((x) => x);
    (disputes.save as jest.Mock).mockImplementation(async (x) => ({ id: 'd1', ...x }));

    const res = await service.open(openDto as any, { id: 'buyer1' });

    expect(res.status).toBe(DisputeStatus.OPEN);
    expect(res.openedById).toBe('buyer1');
    expect(res.againstUserId).toBe('seller1');
  });

  it('rejects unknown products', async () => {
    (products.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.open(openDto as any, { id: 'buyer1' })).rejects.toThrow(NotFoundException);
  });

  it('blocks a second active dispute on the same lot by the same user', async () => {
    (products.findOne as jest.Mock).mockResolvedValue({ id: 'p1', sellerId: 'seller1' });
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd0', status: DisputeStatus.OPEN });
    await expect(service.open(openDto as any, { id: 'buyer1' })).rejects.toThrow(ConflictException);
  });

  it('refuses to reopen a closed dispute', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', status: DisputeStatus.RESOLVED });
    await expect(service.setStatus('d1', DisputeStatus.OPEN)).rejects.toThrow(BadRequestException);
  });

  it('requires the resolve endpoint to close a dispute', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', status: DisputeStatus.UNDER_REVIEW });
    await expect(service.setStatus('d1', DisputeStatus.RESOLVED)).rejects.toThrow(BadRequestException);
  });

  it('resolves once with outcome, resolution text and resolver', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', status: DisputeStatus.UNDER_REVIEW });
    (disputes.save as jest.Mock).mockImplementation(async (x) => x);

    const res = await service.resolve('d1', { id: 'admin1' }, { outcome: DisputeStatus.RESOLVED, resolution: 'Partial refund issued' } as any);

    expect(res.status).toBe(DisputeStatus.RESOLVED);
    expect(res.resolution).toBe('Partial refund issued');
    expect(res.resolvedById).toBe('admin1');
    expect(res.resolvedAt).toBeInstanceOf(Date);
  });

  it('refuses to resolve twice', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', status: DisputeStatus.REJECTED });
    await expect(
      service.resolve('d1', { id: 'admin1' }, { outcome: DisputeStatus.RESOLVED, resolution: 'x' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('only allows parties to leave feedback, and only once closed', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', openedById: 'buyer1', againstUserId: 'seller1', status: DisputeStatus.OPEN });
    await expect(service.addFeedback('d1', { id: 'stranger' }, { rating: 4 } as any)).rejects.toThrow(ForbiddenException);
    await expect(service.addFeedback('d1', { id: 'buyer1' }, { rating: 4 } as any)).rejects.toThrow(BadRequestException);
  });

  it('records feedback once per party after closure', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', openedById: 'buyer1', againstUserId: 'seller1', status: DisputeStatus.RESOLVED });
    (feedback.findOne as jest.Mock).mockResolvedValue(null);
    (feedback.create as jest.Mock).mockImplementation((x) => x);
    (feedback.save as jest.Mock).mockImplementation(async (x) => ({ id: 'f1', ...x }));

    const fb = await service.addFeedback('d1', { id: 'seller1' }, { rating: 5, comment: 'Fair outcome' } as any);
    expect(fb.rating).toBe(5);

    (feedback.findOne as jest.Mock).mockResolvedValue({ id: 'f1' });
    await expect(service.addFeedback('d1', { id: 'seller1' }, { rating: 1 } as any)).rejects.toThrow(ConflictException);
  });

  it('hides a dispute from non-parties (admins allowed)', async () => {
    (disputes.findOne as jest.Mock).mockResolvedValue({ id: 'd1', openedById: 'buyer1', againstUserId: 'seller1' });
    await expect(service.getOne('d1', { id: 'x', role: 'bidder' })).rejects.toThrow(ForbiddenException);
    await expect(service.getOne('d1', { id: 'admin1', role: 'admin' })).resolves.toMatchObject({ id: 'd1' });
  });
});
