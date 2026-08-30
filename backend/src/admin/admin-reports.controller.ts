import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { AdminRole } from './entities/admin.entity';

const ALL_ADMIN_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.PLATFORM_ADMIN,
  AdminRole.FINANCE_ADMIN,
  AdminRole.SUPPORT_ADMIN,
];

/**
 * Admin report/overview endpoints that power the admin dashboards.
 * Guarded by JWT + admin role resolution (any admin role may read reports).
 */
@ApiTags('Admin Reports')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(...ALL_ADMIN_ROLES)
@ApiBearerAuth()
export class AdminReportsController {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  @Get('auctions')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: all auctions (products)' })
  async auctions(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.productRepo.findAndCount({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('bids')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: recent bids' })
  async bids(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.bidRepo.findAndCount({
      relations: ['product', 'bidder'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('sellers')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: all sellers' })
  async sellers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.sellerRepo.findAndCount({
      order: { id: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }

  @Get('payments')
  @AdminRoles(...ALL_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin report: invoices / payments' })
  async payments(@Query('page') page?: number, @Query('limit') limit?: number) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = ((Number(page) || 1) - 1) * take;
    const [data, total] = await this.invoiceRepo.findAndCount({
      order: { issued_at: 'DESC' },
      skip,
      take,
    });
    return { success: true, data: { items: data, total } };
  }
}
