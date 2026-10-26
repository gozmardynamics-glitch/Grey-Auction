import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

/** Sections are read on public page renders — cache briefly. */
const CACHE_TTL_MS = 30_000;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  /** Short-lived read cache keyed by section. */
  private cache = new Map<string, { value: unknown; at: number }>();
  /** Last-known-good fallback if the DB becomes unreachable. */
  private fallback = new Map<string, unknown>();

  constructor(
    @InjectRepository(Setting) private readonly repo: Repository<Setting>,
  ) {}

  /**
   * Values that look like credentials are never returned by a read. They are
   * write-only: the admin UI posts them, and reading them back only creates a
   * way to leak them through logs, error reports or an over-permissive client.
   */
  private redact(value: any): any {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const MASK = '••••••';
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = /pass|secret|token|api[_-]?key|credential/i.test(k) && v ? MASK : v;
    }
    return out;
  }

  async get(key: string): Promise<any> {
    const hit = this.cache.get(key);
    // The cache holds the raw value; redaction happens on the way out so a
    // freshly-saved secret is not readable from the cache either.
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return this.redact(hit.value ?? {});
    try {
      const row = await this.repo.findOne({ where: { key } });
      const value = row?.value ?? {};
      this.cache.set(key, { value, at: Date.now() });
      this.fallback.set(key, value);
      return this.redact(value);
    } catch (error) {
      // Degrade to the last-known value instead of failing every render.
      this.logger.error(`Settings read failed for "${key}": ${error?.message}`);
      return this.fallback.get(key) ?? {};
    }
  }

  async set(key: string, value: any): Promise<void> {
    // No try/catch on purpose: an admin save that fails must surface as a
    // 500, not pretend success.
    await this.repo.upsert({ key, value }, ['key']);
    this.cache.set(key, { value, at: Date.now() });
    this.fallback.set(key, value);
  }

  async getAll(): Promise<Record<string, any>> {
    try {
      const rows = await this.repo.find();
      const out: Record<string, any> = {};
      for (const row of rows) out[row.key] = this.redact(row.value);
      return out;
    } catch (error) {
      this.logger.error(`Settings read-all failed: ${error?.message}`);
      return Object.fromEntries(this.fallback);
    }
  }
}
