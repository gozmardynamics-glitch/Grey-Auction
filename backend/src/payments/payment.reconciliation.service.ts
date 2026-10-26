import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from './payment.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { AdvisoryLockService } from '../common/advisory-lock.service';

/**
 * Reconciliation sweep: payments that never delivered a webhook (e.g. the
 * buyer closed the gateway page, or the webhook was dropped) are re-verified
 * against the provider and settled exactly once. Runs every minute, but only
 * examines payments older than 10 minutes to avoid racing a live webhook.
 */
@Injectable()
export class PaymentReconciliationService {
  private static readonly LOCK_KEY = 'grey:payment-reconciliation';
  private readonly logger = new Logger(PaymentReconciliationService.name);
  private readonly staleMs = 10 * 60 * 1000;
  private readonly batchSize = 25;
  /** Overlap guard: a slow sweep must not run concurrently with the next. */
  private running = false;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orchestration: PaymentOrchestrationService,
    private readonly advisoryLock: AdvisoryLockService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep(): Promise<void> {
    if (this.running) return; // previous tick still in flight
    this.running = true;
    try {
      // Cross-instance guard (5.4): double reconciliation would settle twice.
      const ran = await this.advisoryLock.tryRun(PaymentReconciliationService.LOCK_KEY, () =>
        this.runSweep(),
      );
      if (ran === null) {
        this.logger.log('Another instance holds the reconciliation lock — skipping this tick');
      }
    } finally {
      this.running = false;
    }
  }

  private async runSweep(): Promise<void> {
    let pending: Awaited<ReturnType<PaymentService['findPending']>>;
    try {
      pending = await this.paymentService.findPending(this.staleMs, this.batchSize);
    } catch (error: any) {
      this.logger.error(
        'Reconciliation sweep could not load pending payments: ' + (error?.message ?? error),
      );
      return;
    }
    if (pending.length === 0) return;

    for (const payment of pending) {
      try {
        const resolved = await this.orchestration.reconcilePayment(payment);
        if (resolved.status !== payment.status) {
          this.logger.log(
            `Reconciled payment ${payment.reference}: ${payment.status} -> ${resolved.status}`,
          );
        }
      } catch (error: any) {
        this.logger.warn(
          `Reconciliation failed for ${payment.reference}: ${error?.message}`,
        );
      }
    }
  }
}
