import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const page = await this.service.findBySlug(slug);
    return { success: true, data: page };
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  async upsert(@Param('slug') slug: string, @Body() dto: any) {
    const page = await this.service.upsert(slug, dto);
    return { success: true, data: page };
  }
}
