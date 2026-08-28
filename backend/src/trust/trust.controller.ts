import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConditionReportService } from './condition-report.service';
import { DisputeService } from './dispute.service';
import { KycBadgeService } from './kyc-badge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateConditionReportDto,
  CreateDisputeDto,
  UpdateDisputeStatusDto,
  ResolveDisputeDto,
  DisputeFeedbackDto,
} from './dto/trust.dto';
import { DisputeStatus } from './entities/dispute.entity';

@ApiTags('Trust & Safety')
@Controller('products/:productId/condition-report')
export class ConditionReportController {
  constructor(private readonly service: ConditionReportService) {}

  @Get()
  @ApiOperation({ summary: 'Current condition report for a lot (public)' })
  @ApiParam({ name: 'productId' })
  async latest(@Param('productId') productId: string) {
    const report = await this.service.latestForProduct(productId);
    return { success: true, data: report };
  }

  @Get('history')
  @ApiOperation({ summary: 'Full condition report history for a lot (public)' })
  @ApiParam({ name: 'productId' })
  async history(@Param('productId') productId: string) {
    const data = await this.service.listForProduct(productId);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File a condition report (listing seller or admin)' })
  @ApiParam({ name: 'productId' })
  async create(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateConditionReportDto,
  ) {
    const report = await this.service.create(productId, user, dto);
    return { success: true, message: 'Condition report filed', data: report };
  }
}

@ApiTags('Trust & Safety')
@Controller('sellers')
export class KycBadgeController {
  constructor(private readonly service: KycBadgeService) {}

  @Get(':id/kyc-badge')
  @ApiOperation({ summary: 'Public KYC badge for a seller' })
  async badge(@Param('id') id: string) {
    const data = await this.service.badgeForSeller(id);
    return { success: true, data };
  }
}

@ApiTags('Trust & Safety')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly service: DisputeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a dispute on a transaction' })
  async open(@CurrentUser() user: any, @Body() dto: CreateDisputeDto) {
    const dispute = await this.service.open(dto, user);
    return { success: true, message: 'Dispute opened', data: dispute };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My disputes (opened by me or against me)' })
  async mine(@CurrentUser() user: any) {
    const data = await this.service.listForUser(user.id);
    return { success: true, data };
  }

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin dispute queue (optional ?status= filter)' })
  async queue(@Query('status') status?: DisputeStatus) {
    const data = await this.service.adminList(status);
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dispute detail with feedback (parties + admins)' })
  async one(@Param('id') id: string, @CurrentUser() user: any) {
    const dispute = await this.service.getOne(id, user);
    const feedback = await this.service.feedbackFor(id);
    return { success: true, data: { ...dispute, feedback } };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move a dispute between OPEN / UNDER_REVIEW (admin)' })
  async setStatus(@Param('id') id: string, @Body() dto: UpdateDisputeStatusDto) {
    const data = await this.service.setStatus(id, dto.status);
    return { success: true, data };
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a dispute with an outcome + resolution (admin)' })
  async resolve(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ResolveDisputeDto) {
    const data = await this.service.resolve(id, user, dto);
    return { success: true, data };
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave post-dispute feedback (parties, once closed)' })
  async feedback(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: DisputeFeedbackDto) {
    const data = await this.service.addFeedback(id, user, dto);
    return { success: true, data };
  }
}
