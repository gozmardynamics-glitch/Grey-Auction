import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceSettlementService } from './invoice-settlement.service';
import { InvoiceService } from './invoice.service';

@Injectable()
export class InvoiceCronService implements OnModuleInit {
  private readonly logger = new Logger(InvoiceCronService.name);

  constructor(
    private readonly settlement: InvoiceSettlementService,
    private readonly invoiceService: InvoiceService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Invoice cron service initialized — auctions settle every 5 minutes');
  }

  /**
   * Run every 5 minutes: settle ended auctions into invoices.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async settleEndedAuctions(): Promise<void> {
    this.logger.log('Running auction settlement cron…');
    try {
      const result = await this.settlement.findEndedAuctionsToSettle(
        async (data) => {
          await this.invoiceService.generateInvoice(data);
        },
      );

      this.logger.log(
        `Settlement complete: ${result.settled} invoiced, ${result.skipped} closed without bids, ${result.errors} errors`,
      );

      for (const detail of result.details) {
        this.logger.log(`  ${detail}`);
      }
    } catch (error: any) {
      this.logger.error(`Settlement cron failed: ${error.message}`);
    }
  }

  /**
   * Manual trigger endpoint helper — run settlement on demand.
   */
  async runNow(): Promise<{
    settled: number;
    skipped: number;
    errors: number;
    details: string[];
  }> {
    return this.settlement.findEndedAuctionsToSettle(async (data) => {
      await this.invoiceService.generateInvoice(data);
    });
  }
}
