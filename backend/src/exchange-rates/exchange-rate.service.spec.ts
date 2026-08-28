import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRateService, DEFAULT_RATES } from './exchange-rate.service';
import { ExchangeRate } from './exchange-rate.entity';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  const repo = { count: jest.fn(), find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: getRepositoryToken(ExchangeRate), useValue: repo },
      ],
    }).compile();
    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('seeds defaults only when the table is empty', async () => {
    (repo.count as jest.Mock).mockResolvedValue(0);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockResolvedValue([]);
    await service.seedDefaults();
    expect(repo.save).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ code: 'NGN', rate: 1 })]),
    );
  });

  it('does not clobber existing rates', async () => {
    (repo.count as jest.Mock).mockResolvedValue(4);
    await service.seedDefaults();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns NGN base plus all stored rates', async () => {
    (repo.find as jest.Mock).mockResolvedValue([
      { code: 'USD', rate: 1500, updatedAt: new Date('2026-01-01') },
      { code: 'GHS', rate: 85, updatedAt: new Date('2026-01-02') },
    ]);
    const view = await service.getRates();
    expect(view.base).toBe('NGN');
    expect(view.rates.NGN).toBe(1);
    expect(view.rates.USD).toBe(1500);
    expect(view.rates.GHS).toBe(85);
    expect(view.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('converts NGN into the target currency', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ code: 'USD', rate: 1500, updatedAt: new Date() }]);
    const usd = await service.fromNgn(3000, 'USD');
    expect(usd).toBe(2);
  });

  it('falls back to NGN (1:1) for unknown currency codes', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);
    await expect(service.fromNgn(100, 'XYZ')).resolves.toBe(100);
  });

  it('upserts an existing rate', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ code: 'USD', rate: 1500 });
    (repo.save as jest.Mock).mockImplementation(async (x) => x);
    const res = await service.upsert('USD', 1600);
    expect(res.rate).toBe(1600);
  });

  it('creates a missing rate', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);
    const res = await service.upsert('USD', 1600);
    expect(res.code).toBe('USD');
  });

  it('does nothing on refresh without a configured feed', async () => {
    delete process.env.EXCHANGE_RATE_API_URL;
    await expect(service.refresh()).resolves.toEqual({ updated: 0 });
  });

  it('exposes the default rate set', () => {
    expect(DEFAULT_RATES.NGN).toBe(1);
    expect(DEFAULT_RATES.USD).toBeGreaterThan(0);
    expect(DEFAULT_RATES.GHS).toBeGreaterThan(0);
  });
});
