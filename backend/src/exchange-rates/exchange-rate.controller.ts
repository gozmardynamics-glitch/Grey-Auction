import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';
import { UpsertExchangeRateDto } from './dto/exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly service: ExchangeRateService) {}

  @Get()
  @ApiOperation({ summary: 'Public exchange rates (NGN base)' })
  async rates() {
    const data = await this.service.getRates();
    return { success: true, data };
  }

  @Patch(':code')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Override an exchange rate (admin)' })
  async upsert(@Param('code') code: string, @Body() dto: UpsertExchangeRateDto) {
    const data = await this.service.upsert(code.toUpperCase(), dto.rate);
    return { success: true, data };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh rates from the configured feed (admin)' })
  async refresh() {
    const result = await this.service.refresh();
    return { success: true, ...result };
  }
}
