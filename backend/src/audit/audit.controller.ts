import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { AuditService } from './audit.service';
import { CreateAuditLogDto, AuditLogQueryDto } from './dto/audit.dto';
import { AuditAction, AuditEntityType } from './entities/audit-log.entity';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN, AdminRole.FINANCE_ADMIN)
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated audit logs with filters (admin)' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entityType', required: false, enum: AuditEntityType })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(@Query() query: any) {
    const data = await this.service.findAll(query);
    return { success: true, ...data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics (admin)' })
  async getStats() {
    const data = await this.service.getStats();
    return { success: true, data };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit history for a specific entity (admin)' })
  @ApiParam({ name: 'entityType', enum: AuditEntityType })
  @ApiParam({ name: 'entityId', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.getEntityHistory(
      entityType as any,
      entityId,
      Number(page) || 1,
      Number(limit) || 50,
    );
    return { success: true, data };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit history for a specific user (admin)' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.getUserHistory(
      userId,
      Number(page) || 1,
      Number(limit) || 50,
    );
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Manually create an audit log entry (admin)' })
  async createLog(
    @CurrentUser() user: any,
    @Body() dto: CreateAuditLogDto,
  ) {
    // Admin can manually create audit logs for testing or manual tracking
    const data = await this.service.log(user.id, dto);
    return { success: true, data };
  }
}