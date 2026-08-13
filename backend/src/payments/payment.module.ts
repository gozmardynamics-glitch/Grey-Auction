import { Module } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentController } from './payment.controller';
import { InvoiceModule } from '../invoices/invoice.module';

@Module({
  imports: [InvoiceModule],
  controllers: [PaymentController],
  providers: [PaymentGatewayService],
  exports: [PaymentGatewayService],
})
export class PaymentModule {}
