import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, Product, Bid, Seller, Invoice]),
  ],
  controllers: [AdminController, AdminReportsController],
  providers: [AdminService, AdminRolesGuard],
  exports: [AdminService, AdminRolesGuard, TypeOrmModule],
})
export class AdminModule {}
