import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { Setting } from './setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  const repo = { findOne: jest.fn(), upsert: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: getRepositoryToken(Setting), useValue: repo }],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
  });

  it('persists a section and reads it back', async () => {
    (repo.upsert as jest.Mock).mockResolvedValue(undefined);
    (repo.findOne as jest.Mock).mockResolvedValue({
      key: 'general', value: { siteName: 'GreyAuction' }, updatedAt: new Date(),
    });
    await service.set('general', { siteName: 'GreyAuction' });
    expect(repo.upsert).toHaveBeenCalledWith({ key: 'general', value: { siteName: 'GreyAuction' } }, ['key']);

    // set() primes the cache — bypass it to prove the repo read path works.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
    const value = await service.get('general');
    jest.restoreAllMocks();
    expect(value).toEqual({ siteName: 'GreyAuction' });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { key: 'general' } });
  });

  it('returns {} for unknown sections', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    const value = await service.get('nope');
    expect(value).toEqual({});
  });

  it('falls back to the last-known value when the DB read fails', async () => {
    (repo.upsert as jest.Mock).mockResolvedValue(undefined);
    (repo.findOne as jest.Mock)
      .mockResolvedValueOnce({ key: 'general', value: { tax: 7.5 }, updatedAt: new Date() })
      .mockRejectedValue(new Error('db down'));
    await service.set('general', { tax: 7.5 });
    // Prime the fallback with a fresh read past the cache.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
    const first = await service.get('general');
    expect(first).toEqual({ tax: 7.5 });
    jest.restoreAllMocks();
  });

  it('getAll returns a keyed map of sections', async () => {
    (repo.find as jest.Mock).mockResolvedValue([
      { key: 'general', value: { a: 1 } },
      { key: 'payments', value: { b: 2 } },
    ]);
    const all = await service.getAll();
    expect(all).toEqual({ general: { a: 1 }, payments: { b: 2 } });
  });
});
