import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRate } from './exchange-rate.entity';

/** Indicative, key-free defaults (NGN base). Overridable at runtime / via env feed. */
export const DEFAULT_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1500,
  GHS: 85,
  EUR: 1650,
};

export interface RatesView {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

@Injectable()
export class ExchangeRateService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly repo: Repository<ExchangeRate>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  /** Insert defaults only when the table is empty (never clobbers edits). */
  async seedDefaults(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;
    const rows = Object.entries(DEFAULT_RATES).map(([code, rate]) =>
      this.repo.create({ code, rate }),
    );
    await this.repo.save(rows);
  }

  async getRates(): Promise<RatesView> {
    const rows = await this.repo.find();
    const rates: Record<string, number> = { NGN: 1 };
    for (const r of rows) rates[r.code] = Number(r.rate);
    const updatedAt = rows.length ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime()))).toISOString() : null;
    return { base: 'NGN', rates, updatedAt };
  }

  async upsert(code: string, rate: number): Promise<ExchangeRate> {
    const existing = await this.repo.findOne({ where: { code } });
    if (existing) {
      existing.rate = rate;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ code, rate }));
  }

  /** Convert an NGN amount into the target currency (rounded to 2 dp). */
  async fromNgn(amountNgn: number, code: string): Promise<number> {
    const { rates } = await this.getRates();
    const rate = rates[code] ?? rates.NGN;
    if (!rate) throw new NotFoundException('Unknown currency code: ' + code);
    return Math.round((amountNgn / rate) * 100) / 100;
  }

  /**
   * Daily cron: refresh exchange rates from the configured feed.
   * Runs at 03:00 UTC every day. No-op when EXCHANGE_RATE_API_URL is unset.
   */
  @Cron('0 3 * * *')
  async handleRefreshCron(): Promise<void> {
    const url = process.env.EXCHANGE_RATE_API_URL;
    if (!url) {
      this.logger.debug('Exchange-rate cron skipped: no EXCHANGE_RATE_API_URL configured');
      return;
    }
    this.logger.log('Exchange-rate cron: refreshing from feed…');
    const result = await this.refresh();
    if (result.updated > 0) {
      this.logger.log(`Exchange-rate cron: updated ${result.updated} rate(s)`);
    } else {
      this.logger.warn('Exchange-rate cron: feed returned no usable rates');
    }
  }

  /** Best-effort live refresh from a configured feed (no-op without one). */
  async refresh(): Promise<{ updated: number }> {
    const url = process.env.EXCHANGE_RATE_API_URL;
    if (!url) return { updated: 0 };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return { updated: 0 };
      const json: any = await res.json();
      const rates: Record<string, number> = json?.rates ?? json?.data ?? {};
      let updated = 0;
      for (const [code, rate] of Object.entries(rates)) {
        const n = Number(rate);
        if (Number.isFinite(n) && n > 0) {
          await this.upsert(code, n);
          updated += 1;
        }
      }
      return { updated };
    } catch (e) {
      this.logger.warn('Exchange-rate refresh failed: ' + (e as Error).message);
      return { updated: 0 };
    }
  }
}
