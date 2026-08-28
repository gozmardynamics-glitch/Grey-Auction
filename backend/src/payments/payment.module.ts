import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { InvoiceModule } from '../invoices/invoice.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), InvoiceModule],
  controllers: [PaymentController],
  providers: [PaymentGatewayService, PaymentService],
  exports: [PaymentGatewayService, PaymentService],
})
export class PaymentModule {}
