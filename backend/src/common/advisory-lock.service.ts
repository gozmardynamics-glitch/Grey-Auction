import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Cross-instance cron exclusivity via Postgres session advisory locks (5.4).
 *
 * The `running` booleans in cron services only guard against overlap within
 * ONE process. Two app instances would both run settlement, escrow sweeps and
 * reconciliation. `tryRun` takes a session-scoped advisory lock — which lives
 * on a single pooled connection held open for the duration — so only one
 * instance anywhere runs the job; the others skip the tick.
 */
@Injectable()
export class AdvisoryLockService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Attempt `key`; if no other instance holds it, run `fn()` and release.
   * Returns `null` when the lock is held elsewhere (caller should skip).
   * Lock keys are arbitrary strings, conventionally 'grey:<job>'.
   */
  async tryRun<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      const rows: Array<{ locked: boolean }> = await qr.query(
        'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
        [key],
      );
      if (!rows[0]?.locked) return null;
      try {
        return await fn();
      } finally {
        // Same connection: session locks must be released by their owner.
        await qr.query('SELECT pg_advisory_unlock(hashtext($1))', [key]).catch(() => undefined);
      }
    } finally {
      await qr.release();
    }
  }
}
