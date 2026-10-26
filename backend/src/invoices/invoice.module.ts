import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Invoice } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceSettlementService } from './invoice-settlement.service';
import { InvoiceCronService } from './invoice-cron.service';
import { InvoiceSettlementProcessor, INVOICE_SETTLEMENT_QUEUE } from '../queue/invoice-settlement.processor';
import { BullSettlementQueue } from '../queue/bull-settlement-queue';
import { QueueHealthService } from '../queue/queue-health.service';
import { SETTLEMENT_QUEUE } from './settlement-queue.port';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { EmailModule } from '../common/email/email.module';
import { FeeModule } from '../fees/fee.module';
import { NotificationModule } from '../notification/notification.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Product, Bid]),
    BullModule.registerQueue({ name: INVOICE_SETTLEMENT_QUEUE }),
    EmailModule,
    FeeModule,
    NotificationModule,
    CommonModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceSettlementService,
    InvoiceCronService,
    InvoiceSettlementProcessor,
    BullSettlementQueue,
    QueueHealthService,
    { provide: SETTLEMENT_QUEUE, useExisting: BullSettlementQueue },
  ],
  exports: [InvoiceService, InvoiceSettlementService],
})
export class InvoiceModule {}
