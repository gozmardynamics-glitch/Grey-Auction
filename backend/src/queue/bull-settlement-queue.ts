import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import {
  SettlementQueuePort,
} from '../invoices/settlement-queue.port';
import { INVOICE_SETTLEMENT_QUEUE } from './invoice-settlement.processor';

@Injectable()
export class BullSettlementQueue implements SettlementQueuePort {
  private readonly logger = new Logger(BullSettlementQueue.name);

  constructor(
    @InjectQueue(INVOICE_SETTLEMENT_QUEUE)
    private readonly queue: Queue,
  ) {}

  async isReady(timeoutMs: number): Promise<boolean> {
    try {
      await Promise.race([
        this.queue.waitUntilReady(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('queue not ready')), timeoutMs),
        ),
      ]);
      return true;
    } catch {
      this.logger.warn('Settlement queue not reachable (is Redis running?)');
      return false;
    }
  }

  async enqueue(productId: string): Promise<void> {
    await this.queue.add(
      'settle-invoice',
      { productId },
      {
        jobId: `settle-${productId}-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
