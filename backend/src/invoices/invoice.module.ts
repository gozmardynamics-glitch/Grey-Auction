import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceSettlementService } from './invoice-settlement.service';
import { InvoiceCronService } from './invoice-cron.service';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { EmailModule } from '../common/email/email.module';
import { FeeModule } from '../fees/fee.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Product, Bid]),
    EmailModule,
    FeeModule,
    NotificationModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceSettlementService, InvoiceCronService],
  exports: [InvoiceService, InvoiceSettlementService],
})
export class InvoiceModule {}
