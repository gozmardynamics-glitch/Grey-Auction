import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { InvoiceSettlementService } from '../invoices/invoice-settlement.service';

export const INVOICE_SETTLEMENT_QUEUE = 'invoice-settlement';

export interface InvoiceSettlementJobData {
  productId: string;
}

@Processor(INVOICE_SETTLEMENT_QUEUE, { concurrency: 5 })
@Injectable()
export class InvoiceSettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceSettlementProcessor.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly settlementService: InvoiceSettlementService,
  ) {
    super();
  }

  async process(job: Job<InvoiceSettlementJobData>): Promise<void> {
    const { productId } = job.data;
    this.logger.log(`Processing settlement for product ${productId} (attempt ${job.attemptsMade + 1})`);

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['seller'],
    });

    if (!product) {
      this.logger.warn(`Product ${productId} not found, skipping settlement`);
      return;
    }

    if (![ProductStatus.ACTIVE, ProductStatus.APPROVED].includes(product.status)) {
      this.logger.log(`Product ${productId} is not in active status (current: ${product.status}), skipping`);
      return;
    }

    // Check if auction has ended
    if (product.endTime && new Date(product.endTime) > new Date()) {
      this.logger.log(`Auction for product ${productId} has not ended yet, re-queueing`);
      throw new Error('Auction not ended yet');
    }

    // Process settlement
    await this.settlementService.settleProduct(productId);
    this.logger.log(`Successfully settled product ${productId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Product settlement job ${job.id} completed for product ${job.data.productId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Product settlement job ${job.id} failed for product ${job.data.productId}: ${err.message}`);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Product settlement job ${job.id} stalled for product ${job.data.productId}`);
  }
}