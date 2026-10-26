import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';
import { AdvisoryLockService } from '../common/advisory-lock.service';

/**
 * U5 answer #4 — sweeps escrow holds whose auto-release window (fixed at
 * auction creation) has elapsed and releases them to the seller's wallet.
 */
@Injectable()
export class EscrowAutoReleaseService {
  private static readonly LOCK_KEY = 'grey:escrow-auto-release';
  private readonly logger = new Logger(EscrowAutoReleaseService.name);
  /** Overlap guard: a slow sweep must not run concurrently with the next. */
  private running = false;

  constructor(
    private readonly escrowService: EscrowService,
    private readonly advisoryLock: AdvisoryLockService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    if (this.running) return; // previous tick still in flight
    this.running = true;
    try {
      // Cross-instance guard (5.4): two app instances must not both sweep.
      const ran = await this.advisoryLock.tryRun(EscrowAutoReleaseService.LOCK_KEY, () =>
        this.runSweep(),
      );
      if (ran === null) {
        this.logger.log('Another instance holds the escrow sweep lock — skipping this tick');
      }
    } finally {
      this.running = false;
    }
  }

  private async runSweep(): Promise<void> {
    try {
      const released = await this.escrowService.autoReleaseDue();
      if (released > 0) {
        this.logger.log('Escrow auto-release: ' + released + ' hold(s) released');
      }
    } catch (error: any) {
      this.logger.error('Escrow auto-release sweep failed: ' + error.message);
    }
  }
}