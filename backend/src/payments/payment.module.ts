import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { Payment } from './entities/payment.entity';
import { InvoiceModule } from '../invoices/invoice.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), InvoiceModule, WalletModule],
  controllers: [PaymentController],
  providers: [PaymentGatewayService, PaymentService, PaymentOrchestrationService],
  exports: [PaymentGatewayService, PaymentService, PaymentOrchestrationService],
})
export class PaymentModule {}
