import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from './payment.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';

/**
 * Reconciliation sweep: payments that never delivered a webhook (e.g. the
 * buyer closed the gateway page, or the webhook was dropped) are re-verified
 * against the provider and settled exactly once. Runs every minute, but only
 * examines payments older than 10 minutes to avoid racing a live webhook.
 */
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);
  private readonly staleMs = 10 * 60 * 1000;
  private readonly batchSize = 25;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orchestration: PaymentOrchestrationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep(): Promise<void> {
    const pending = await this.paymentService.findPending(this.staleMs, this.batchSize);
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
