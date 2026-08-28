import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateHoldDto, RefundDto } from './dto/escrow.dto';

@ApiTags('Escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly service: EscrowService) {}

  @Post('holds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place funds in escrow for an invoice' })
  async hold(@CurrentUser() user: any, @Body() dto: CreateHoldDto) {
    const data = await this.service.hold({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      buyerId: user.id,
      sellerId: dto.sellerId,
    });
    return { success: true, data };
  }

  @Get('holds/invoice/:invoiceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escrow holds for an invoice (parties only)' })
  async forInvoice(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) {
    const data = await this.service.getForInvoice(invoiceId, user.id);
    return { success: true, data };
  }

  @Post('holds/:id/dispute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an escrow hold as disputed (party)' })
  async dispute(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.service.markDisputed(id, user.id);
    return { success: true, data };
  }

  @Post('holds/:id/release')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release escrowed funds to the seller (admin)' })
  async release(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.service.release(id, user.id);
    return { success: true, data };
  }

  @Post('holds/:id/refund')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund escrowed funds to the buyer (admin)' })
  async refund(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RefundDto) {
    const data = await this.service.refund(id, user.id, dto.reason);
    return { success: true, data };
  }
}
