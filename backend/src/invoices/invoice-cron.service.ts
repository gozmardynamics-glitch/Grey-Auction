import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceSettlementService } from './invoice-settlement.service';
import { AdvisoryLockService } from '../common/advisory-lock.service';

@Injectable()
export class InvoiceCronService implements OnModuleInit {
  private static readonly LOCK_KEY = 'grey:settlement';
  private static readonly EXPIRY_LOCK_KEY = 'grey:approval-expiry';
  private readonly logger = new Logger(InvoiceCronService.name);
  /** Overlap guard: a slow settlement must not run concurrently with the next. */
  private running = false;

  constructor(
    private readonly settlement: InvoiceSettlementService,
    private readonly advisoryLock: AdvisoryLockService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Invoice cron service initialized — auctions settle every 5 minutes');
  }

  /**
   * Run every 5 minutes: settle ended auctions into invoices.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async settleEndedAuctions(): Promise<void> {
    if (this.running) {
      this.logger.warn('Settlement still running — skipping this tick');
      return;
    }
    this.running = true;
    try {
      // Cross-instance guard (5.4): with two app instances, only one settles;
      // the other skips the tick. The in-process flag above stays as the
      // first line of defence.
      const ran = await this.advisoryLock.tryRun(InvoiceCronService.LOCK_KEY, () =>
        this.runSettlement(),
      );
      if (ran === null) {
        this.logger.log('Another instance holds the settlement lock — skipping this tick');
      }
    } finally {
      this.running = false;
    }
  }

  /**
   * Decision 3b — every 10 minutes, expire winning bids the seller never
   * approved, so a lot cannot sit in limbo forever.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireUnapprovedSales(): Promise<void> {
    try {
      const ran = await this.advisoryLock.tryRun(InvoiceCronService.EXPIRY_LOCK_KEY, async () => {
        const expired = await this.settlement.expirePendingApprovals();
        return expired;
      });
      if (ran === null) {
        this.logger.log('Another instance holds the approval-expiry lock — skipping this tick');
      }
    } catch (error: any) {
      this.logger.error('Approval expiry sweep failed: ' + error.message);
    }
  }

  private async runSettlement(): Promise<void> {
    this.logger.log('Running auction settlement cron…');
    try {
      const result = await this.settlement.settleEndedAuctions();

      this.logger.log(
        'Settlement complete: ' + result.settled + ' invoiced, ' + result.skipped + ' closed/skipped, ' + result.errors + ' errors',
      );

      for (const detail of result.details) {
        this.logger.log('  ' + detail);
      }
    } catch (error: any) {
      this.logger.error('Settlement cron failed: ' + error.message);
    }
  }

  /**
   * Manual trigger endpoint helper — run settlement on demand.
   */
  async runNow() {
    return this.settlement.settleEndedAuctions();
  }
}
