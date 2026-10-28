import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Invoice } from '../invoices/invoice.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { FeeModule } from '../fees/fee.module';
import { InvoiceFactoryModule } from '../invoices/invoice-factory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Invoice]),
    FeeModule,
    // Only the creation seam: importing InvoiceModule would be a cycle.
    InvoiceFactoryModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}