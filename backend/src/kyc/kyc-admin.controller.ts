import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { KycService } from './kyc.service';
import {
  CreateKycRequirementDto,
  ReviewKycDocumentDto,
  UpdateKycRequirementDto,
} from './dto/kyc.dto';
import { KycDocumentStatus } from './entities/kyc-document.entity';

/**
 * Admin control of KYC: the admin decides which documents exist, what they are
 * called, whether they are mandatory, and then reviews each submission.
 */
@ApiTags('KYC (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.PLATFORM_ADMIN,
  AdminRole.SUPPORT_ADMIN,
)
@Controller('admin/kyc')
export class KycAdminController {
  constructor(private readonly service: KycService) {}

  @Get('requirements')
  @ApiOperation({ summary: 'List KYC document requirements' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async listRequirements(@Query('includeInactive') includeInactive?: string) {
    const data = await this.service.listRequirements(includeInactive === 'true');
    return { success: true, data };
  }

  @Post('requirements')
  @ApiOperation({
    summary: 'Define a KYC document requirement (name, audience, mandatory)',
  })
  async createRequirement(
    @CurrentUser() user: any,
    @Body() dto: CreateKycRequirementDto,
  ) {
    const data = await this.service.createRequirement(user.id, dto);
    return { success: true, message: 'Requirement created', data };
  }

  @Patch('requirements/:id')
  @ApiOperation({ summary: 'Rename or reconfigure a requirement' })
  @ApiParam({ name: 'id' })
  async updateRequirement(
    @Param('id') id: string,
    @Body() dto: UpdateKycRequirementDto,
  ) {
    const data = await this.service.updateRequirement(id, dto);
    return { success: true, message: 'Requirement updated', data };
  }

  @Post('requirements/:id/deactivate')
  @ApiOperation({
    summary: 'Stop asking for a requirement (history is preserved)',
  })
  @ApiParam({ name: 'id' })
  async deactivateRequirement(@Param('id') id: string) {
    const data = await this.service.deactivateRequirement(id);
    return { success: true, message: 'Requirement deactivated', data };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Review queue of submitted KYC documents' })
  @ApiQuery({ name: 'status', required: false, enum: KycDocumentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listDocuments(
    @Query('status') status?: KycDocumentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.listDocumentsForReview(
      status,
      Number(page) || 1,
      Number(limit) || 50,
    );
    return { success: true, ...data };
  }

  @Post('documents/:id/review')
  @ApiOperation({ summary: 'Approve or reject a submitted document' })
  @ApiParam({ name: 'id' })
  async review(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewKycDocumentDto,
  ) {
    const data = await this.service.reviewDocument(id, user.id, dto);
    return {
      success: true,
      message: `Document ${dto.status}`,
      data,
    };
  }
}
