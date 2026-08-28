import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConditionReportService } from './condition-report.service';
import { ConditionReport } from './entities/condition-report.entity';
import { Product } from '../products/entities/product.entity';
import { LotCondition, ConditionGrade } from './entities/condition-report.entity';

describe('ConditionReportService', () => {
  let service: ConditionReportService;
  const repo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const products = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConditionReportService,
        { provide: getRepositoryToken(ConditionReport), useValue: repo },
        { provide: getRepositoryToken(Product), useValue: products },
      ],
    }).compile();
    service = module.get<ConditionReportService>(ConditionReportService);
  });

  const dto = {
    condition: LotCondition.USED,
    grade: ConditionGrade.B,
    summary: 'Engine runs, minor panel dents',
  };

  it('rejects when the product does not exist', async () => {
    (products.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.create('p1', { id: 'u1', role: 'seller' }, dto as any)).rejects.toThrow(NotFoundException);
  });

  it('rejects a report from someone who is not the lot owner', async () => {
    (products.findOne as jest.Mock).mockResolvedValue({ id: 'p1', sellerId: 'other' });
    await expect(service.create('p1', { id: 'u1', role: 'bidder' }, dto as any)).rejects.toThrow(ForbiddenException);
  });

  it('lets the owner file a report (defects default to [])', async () => {
    (products.findOne as jest.Mock).mockResolvedValue({ id: 'p1', sellerId: 'u1' });
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => ({ id: 'r1', ...x }));

    const res = await service.create('p1', { id: 'u1', role: 'seller' }, dto as any);

    expect(res.productId).toBe('p1');
    expect(res.defects).toEqual([]);
    expect(repo.save).toHaveBeenCalled();
  });

  it('lets an admin file a report on any lot', async () => {
    (products.findOne as jest.Mock).mockResolvedValue({ id: 'p1', sellerId: 'someone-else' });
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => ({ id: 'r2', ...x }));

    const res = await service.create('p1', { id: 'admin1', role: 'admin' }, dto as any);
    expect(res.reportedById).toBe('admin1');
  });

  it('returns the newest report as the current one', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 'newest' }]);
    const latest = await service.latestForProduct('p1');
    expect(latest).toEqual({ id: 'newest' });
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 'p1' }, take: 1 }),
    );
  });

  it('returns null when no report exists yet', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);
    expect(await service.latestForProduct('p1')).toBeNull();
  });
});
