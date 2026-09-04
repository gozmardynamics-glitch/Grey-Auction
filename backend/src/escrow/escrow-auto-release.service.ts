import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';

/**
 * U5 answer #4 — sweeps escrow holds whose auto-release window (fixed at
 * auction creation) has elapsed and releases them to the seller's wallet.
 */
@Injectable()
export class EscrowAutoReleaseService {
  private readonly logger = new Logger(EscrowAutoReleaseService.name);
  /** Overlap guard: a slow sweep must not run concurrently with the next. */
  private running = false;

  constructor(private readonly escrowService: EscrowService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    if (this.running) return; // previous tick still in flight
    this.running = true;
    try {
      await this.runSweep();
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