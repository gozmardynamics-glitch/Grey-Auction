import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowHold } from './entities/escrow-hold.entity';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { EscrowAutoReleaseService } from './escrow-auto-release.service';
import { WalletModule } from '../wallet/wallet.module';
import { Invoice } from '../invoices/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EscrowHold, Invoice]), WalletModule],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowAutoReleaseService],
  exports: [EscrowService],
})
export class EscrowModule {}