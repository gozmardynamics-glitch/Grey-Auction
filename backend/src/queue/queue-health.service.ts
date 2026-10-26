import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { SETTLEMENT_QUEUE, SettlementQueuePort } from '../invoices/settlement-queue.port';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Settlement-queue health (5.10).
 *
 * Settlement degrades to inline execution when Redis is unreachable, which is
 * the right behaviour — a missing queue must never stall settlement — but the
 * degradation used to be invisible apart from one warn-level log line. This
 * service probes the queue, publishes the state as a metric that can be
 * alerted on, and logs at error level on the transition into (and out of)
 * degraded mode, once per transition rather than once per probe.
 */
@Injectable()
export class QueueHealthService implements OnModuleInit {
  private readonly logger = new Logger(QueueHealthService.name);
  private healthy: boolean | null = null;

  constructor(
    @Optional()
    @Inject(SETTLEMENT_QUEUE)
    private readonly queue?: SettlementQueuePort,
    @Optional()
    private readonly metrics?: MetricsService,
  ) {}

  /** In production the queue is part of the expected topology; elsewhere it is optional. */
  private get queueRequired(): boolean {
    return process.env.NODE_ENV === 'production' && process.env.QUEUE_REQUIRED !== 'false';
  }

  async onModuleInit(): Promise<void> {
    await this.probe();
    if (!this.queue) {
      this.logger.warn(
        'No settlement queue implementation registered — settlement runs inline (single-instance mode)',
      );
    }
  }

  /** Every minute; a Redis blip must be visible within a dashboard scrape. */
  @Interval(60_000)
  async probe(): Promise<boolean> {
    if (!this.queue) {
      this.metrics?.setQueueAvailable(false);
      return false;
    }

    let available = false;
    try {
      available = await this.queue.isReady(2000);
    } catch {
      available = false;
    }

    this.metrics?.setQueueAvailable(available);

    if (this.healthy === available) return available; // no repeat spam

    if (!available) {
      this.logger.error(
        'SETTLEMENT QUEUE UNAVAILABLE — settlement is running inline. ' +
          (this.queueRequired
            ? 'Redis is required in this environment: restore it or set QUEUE_REQUIRED=false to accept degraded mode.'
            : 'Start Redis to restore queued settlement.'),
      );
    } else if (this.healthy === false) {
      this.logger.log('Settlement queue reachable again — queued settlement restored');
    }

    this.healthy = available;
    return available;
  }
}
