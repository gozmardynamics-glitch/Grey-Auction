import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ExchangeRate } from './exchange-rate.entity';
import { ForexProviderService } from './forex-provider.service';

/**
 * Indicative fallbacks only — used when the table is empty AND no provider is
 * reachable. Refreshed from live providers at boot and daily at 03:00 UTC.
 */
export const DEFAULT_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1330,
  GHS: 115,
  EUR: 1495,
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
    private readonly forex: ForexProviderService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
    // Best effort: replace the indicative seeds with live rates at boot so a
    // fresh install is not stuck on stale numbers. Failures keep the seeds.
    void this.refresh().catch(() => undefined);
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
    const updatedAt = rows.length
      ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime()))).toISOString()
      : null;
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
   * Daily cron: refresh exchange rates from the open-source forex providers.
   * Runs at 03:00 UTC. EXCHANGE_RATE_API_URL, when set, takes precedence.
   */
  @Cron('0 3 * * *')
  async handleRefreshCron(): Promise<void> {
    this.logger.log('Exchange-rate cron: refreshing');
    const result = await this.refresh();
    if (result.updated > 0) {
      this.logger.log(`Exchange-rate cron: updated ${result.updated} rate(s)`);
    } else {
      this.logger.warn('Exchange-rate cron: no usable rates from any provider');
    }
  }

  /**
   * Best-effort live refresh.
   *
   * The default path uses the keyless open-source provider chain and re-bases
   * its USD table onto NGN, which is how this table is stored:
   *   rate[X] = NGN per 1 X = (USD→NGN) / (USD→X)
   *
   * An explicit EXCHANGE_RATE_API_URL still wins and is treated as an
   * NGN-based `{ rates: { CODE: ngnPerUnit } }` map, matching the previous
   * contract.
   */
  async refresh(): Promise<{ updated: number; source?: string }> {
    const explicitUrl = process.env.EXCHANGE_RATE_API_URL;
    if (explicitUrl) return this.refreshFromUrl(explicitUrl);

    const usd = await this.forex.getUsdRates();
    if (!usd) return { updated: 0 };

    const ngnPerUsd = usd.rates.NGN;
    if (!ngnPerUsd) {
      this.logger.warn('Forex feed returned no NGN rate; keeping stored rates');
      return { updated: 0, source: usd.source };
    }

    let updated = 0;
    await this.upsert('NGN', 1);
    updated += 1;

    for (const [code, usdPerUnit] of Object.entries(usd.rates)) {
      if (code === 'NGN' || !Number.isFinite(usdPerUnit) || usdPerUnit <= 0) continue;
      const ngnPerUnit = Math.round((ngnPerUsd / usdPerUnit) * 1e6) / 1e6;
      if (Number.isFinite(ngnPerUnit) && ngnPerUnit > 0) {
        await this.upsert(code, ngnPerUnit);
        updated += 1;
      }
    }

    this.logger.log(
      `Exchange rates refreshed from ${usd.source}: ${updated} code(s), NGN per USD ${ngnPerUsd}`,
    );
    return { updated, source: usd.source };
  }

  /** Legacy path: one configured feed returning `{ rates: {...} }`. */
  private async refreshFromUrl(
    url: string,
  ): Promise<{ updated: number; source?: string }> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return { updated: 0 };
      const json: any = await res.json();
      const rates: Record<string, number> = json?.rates ?? json?.data ?? {};
      let updated = 0;
      for (const [code, rate] of Object.entries(rates)) {
        const n = Number(rate);
        if (Number.isFinite(n) && n > 0) {
          await this.upsert(code.toUpperCase(), n);
          updated += 1;
        }
      }
      return { updated, source: 'EXCHANGE_RATE_API_URL' };
    } catch (e) {
      this.logger.warn('Exchange-rate refresh failed: ' + (e as Error).message);
      return { updated: 0 };
    }
  }
}
