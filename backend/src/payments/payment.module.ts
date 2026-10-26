import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { PaymentReconciliationService } from './payment.reconciliation.service';
import { Payment } from './entities/payment.entity';
import { InvoiceModule } from '../invoices/invoice.module';
import { WalletModule } from '../wallet/wallet.module';
import { OrderModule } from '../orders/order.module';
import { EscrowModule } from '../escrow/escrow.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), InvoiceModule, WalletModule, OrderModule, EscrowModule, CommonModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentOrchestrationService, PaymentReconciliationService],
  exports: [PaymentService, PaymentOrchestrationService],
})
export class PaymentModule {}
