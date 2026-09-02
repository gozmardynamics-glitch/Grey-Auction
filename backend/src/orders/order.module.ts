import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Invoice } from '../invoices/invoice.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { FeeModule } from '../fees/fee.module';
import { InvoiceModule } from '../invoices/invoice.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Invoice]),
    FeeModule,
    InvoiceModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}