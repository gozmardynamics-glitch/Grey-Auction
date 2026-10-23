import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRateService, DEFAULT_RATES } from './exchange-rate.service';
import { ExchangeRate } from './exchange-rate.entity';
import { ForexProviderService } from './forex-provider.service';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  const repo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const forex = { getUsdRates: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.EXCHANGE_RATE_API_URL;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: getRepositoryToken(ExchangeRate), useValue: repo },
        { provide: ForexProviderService, useValue: forex },
      ],
    }).compile();
    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  afterEach(() => {
    delete process.env.EXCHANGE_RATE_API_URL;
    delete (global as any).fetch;
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
    (repo.find as jest.Mock).mockResolvedValue([
      { code: 'USD', rate: 1500, updatedAt: new Date() },
    ]);
    await expect(service.fromNgn(3000, 'USD')).resolves.toBe(2);
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

  it('exposes the default rate set', () => {
    expect(DEFAULT_RATES.NGN).toBe(1);
    expect(DEFAULT_RATES.USD).toBeGreaterThan(0);
    expect(DEFAULT_RATES.GHS).toBeGreaterThan(0);
  });

  // ── Provider path (no EXCHANGE_RATE_API_URL) ───────────────────────────

  it('returns zero updates when every forex provider is unreachable', async () => {
    forex.getUsdRates.mockResolvedValue(null);
    await expect(service.refresh()).resolves.toEqual({ updated: 0 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('re-bases USD rates onto NGN: rate[X] = USD->NGN / USD->X', async () => {
    forex.getUsdRates.mockResolvedValue({
      source: 'fawazahmed0',
      // 1 USD buys 1332.5 NGN, 11.5 GHS, 0.89 EUR
      rates: { NGN: 1332.5, GHS: 11.5, EUR: 0.89, USD: 1 },
    });
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    const saved: any[] = [];
    (repo.save as jest.Mock).mockImplementation(async (x) => {
      saved.push(x);
      return x;
    });

    const result = await service.refresh();

    // NGN + GHS + EUR + USD
    expect(result.updated).toBe(4);
    expect(result.source).toBe('fawazahmed0');

    const byCode = Object.fromEntries(saved.map((r) => [r.code, r.rate]));
    expect(byCode.NGN).toBe(1);
    expect(byCode.USD).toBeCloseTo(1332.5, 4);
    // NGN per 1 GHS = 1332.5 / 11.5
    expect(byCode.GHS).toBeCloseTo(115.869565, 4);
    // NGN per 1 EUR = 1332.5 / 0.89
    expect(byCode.EUR).toBeCloseTo(1497.191011, 4);
  });

  it('keeps stored rates when the feed omits NGN', async () => {
    forex.getUsdRates.mockResolvedValue({
      source: 'fawazahmed0',
      rates: { USD: 1, EUR: 0.89 },
    });
    const result = await service.refresh();
    expect(result.updated).toBe(0);
    expect(result.source).toBe('fawazahmed0');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('skips non-positive and non-finite provider values', async () => {
    forex.getUsdRates.mockResolvedValue({
      source: 'fawazahmed0',
      rates: { NGN: 1332.5, BAD: -1, ZERO: 0, NAN: Number.NaN },
    });
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    const result = await service.refresh();
    // NGN only — the three invalid entries are skipped.
    expect(result.updated).toBe(1);
  });

  // ── Cron ───────────────────────────────────────────────────────────────

  it('cron always refreshes now that keyless providers are the default', async () => {
    const refreshSpy = jest.spyOn(service, 'refresh').mockResolvedValue({ updated: 3 });
    await service.handleRefreshCron();
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('cron logs a warning when no provider yields rates', async () => {
    jest.spyOn(service, 'refresh').mockResolvedValue({ updated: 0 });
    const warnSpy = jest.spyOn(service['logger'], 'warn');
    await service.handleRefreshCron();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no usable rates'),
    );
  });

  // ── Legacy explicit-feed path ──────────────────────────────────────────

  it('EXCHANGE_RATE_API_URL takes precedence over the providers', async () => {
    process.env.EXCHANGE_RATE_API_URL = 'https://example.com/rates';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { USD: 1550, GBP: 1900 } }),
    }) as any;
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    const result = await service.refresh();
    expect(result.updated).toBe(2);
    expect(result.source).toBe('EXCHANGE_RATE_API_URL');
    expect(forex.getUsdRates).not.toHaveBeenCalled();
  });

  it('refresh handles fetch errors gracefully', async () => {
    process.env.EXCHANGE_RATE_API_URL = 'https://example.com/rates';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;
    await expect(service.refresh()).resolves.toEqual({ updated: 0 });
  });

  it('refresh handles a non-OK HTTP response', async () => {
    process.env.EXCHANGE_RATE_API_URL = 'https://example.com/rates';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as any;
    await expect(service.refresh()).resolves.toEqual({ updated: 0 });
  });

  it('refresh handles the { data: {...} } response shape', async () => {
    process.env.EXCHANGE_RATE_API_URL = 'https://example.com/rates';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { USD: 1550 } }),
    }) as any;
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    await expect(service.refresh()).resolves.toMatchObject({ updated: 1 });
  });

  it('refresh skips invalid rate values', async () => {
    process.env.EXCHANGE_RATE_API_URL = 'https://example.com/rates';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { USD: 1550, BAD: -1, ZERO: 0, NAN: 'abc' } }),
    }) as any;
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    await expect(service.refresh()).resolves.toMatchObject({ updated: 1 });
  });
});
