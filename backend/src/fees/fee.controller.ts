import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeeService, UpsertFeeDto, UpsertFeeOverrideDto } from './fee.service';
import { FeeOverrideScope } from './fee-override.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

@ApiTags('Fees')
@Controller('fees')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Get()
  @ApiOperation({ summary: 'List all fee configurations' })
  async findAll() {
    const data = await this.feeService.findAll();
    return { success: true, data };
  }

  @Get('overrides')
  @ApiOperation({ summary: 'List per-seller / per-product fee overrides (U5)' })
  async listOverrides(@Query('scope') scope?: FeeOverrideScope) {
    const data = await this.feeService.listOverrides(scope);
    return { success: true, data };
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Compute price breakdown for a bid amount' })
  async breakdown(
    @Query('amount') amount: string,
    @Query('category') category?: string,
    @Query('productId') productId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    const parsedAmount = parseFloat(amount || '0');
    if (productId || sellerId) {
      const data = await this.feeService.resolveAndCompute(parsedAmount, {
        productId: productId || null,
        sellerId: sellerId || null,
        category: category || null,
      });
      return { success: true, data };
    }
    const data = await this.feeService.getBreakdown(parsedAmount, category);
    return { success: true, data };
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get fee configuration for a category' })
  async byCategory(@Param('category') category: string) {
    const data = await this.feeService.findByCategory(category);
    return { success: true, data };
  }

  @Put()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a fee configuration (Admin)' })
  async upsert(@Body() dto: UpsertFeeDto) {
    const data = await this.feeService.upsert(dto);
    return { success: true, message: 'Fee configuration saved', data };
  }

  @Put('overrides')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create/update a per-seller or per-product fee override (Admin, U5)' })
  async upsertOverride(@Body() dto: UpsertFeeOverrideDto) {
    const data = await this.feeService.upsertOverride(dto);
    return { success: true, message: 'Fee override saved', data };
  }

  @Delete('overrides/:scope/:scopeId')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a fee override so the scope inherits again (Admin, U5)' })
  async removeOverride(
    @Param('scope') scope: FeeOverrideScope,
    @Param('scopeId') scopeId: string,
  ) {
    await this.feeService.removeOverride(scope, scopeId);
    return { success: true, message: 'Fee override removed' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a fee configuration (Admin)' })
  async remove(@Param('id') id: string) {
    await this.feeService.remove(id);
    return { success: true, message: 'Fee configuration deleted' };
  }
}