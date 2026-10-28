import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';
import { EscrowHold } from '../escrow/entities/escrow-hold.entity';
import { SellerPayout } from '../seller/entities/seller-payout.entity';
import { Room } from '../rooms/entities/room.entity';
import { Ticket } from '../tickets/ticket.entity';
import { SellerReview } from '../seller/entities/seller-review.entity';
import { Dispute } from '../trust/entities/dispute.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      User,
      Product,
      Bid,
      Seller,
      Invoice,
      // The money KPIs read escrow holds and in-flight payouts.
      EscrowHold,
      SellerPayout,
      Room,
      // Suspending a buyer is checked against their open complaints.
      Ticket,
      // Flagged reviews surface in the complaint queue, and disputes are
      // joined into the complaint register.
      SellerReview,
      Dispute,
    ]),
    // Goodwill credits go through the ledger, not a balance edit.
    WalletModule,
  ],
  controllers: [AdminController, AdminReportsController],
  providers: [AdminService, AdminRolesGuard],
  exports: [AdminService, AdminRolesGuard, TypeOrmModule],
})
export class AdminModule {}
