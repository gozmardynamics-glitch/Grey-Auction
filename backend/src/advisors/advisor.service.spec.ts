import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdvisorService } from './advisor.service';
import { Advisor, AdvisorType } from './entities/advisor.entity';

describe('AdvisorService', () => {
  let service: AdvisorService;
  const repo = { find: jest.fn(), findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvisorService,
        { provide: getRepositoryToken(Advisor), useValue: repo },
      ],
    }).compile();
    service = module.get<AdvisorService>(AdvisorService);
  });

  it('lists only active advisors and applies filters', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 'a1' }]);
    const rows = await service.list({ country: 'Nigeria', type: AdvisorType.DEALER });
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, country: 'Nigeria', type: AdvisorType.DEALER },
      }),
    );
    expect(rows).toHaveLength(1);
  });

  it('lists without filters', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);
    await service.list({});
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('throws for unknown advisors', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.get('nope')).rejects.toThrow(NotFoundException);
  });

  it('returns an advisor by id', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 'a1', name: 'North West Auto Advisory' });
    await expect(service.get('a1')).resolves.toMatchObject({ name: 'North West Auto Advisory' });
  });
});
