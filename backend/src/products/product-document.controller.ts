import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
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
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { ProductDocumentService } from './product-document.service';
import { CreateProductDocumentDto, UpdateProductDocumentDto, VerifyProductDocumentDto } from './dto/product-document.dto';
import { ProductDocumentType } from './entities/product-document.entity';

@ApiTags('Product Documents')
@Controller('products')
export class ProductDocumentController {
  constructor(private readonly service: ProductDocumentService) {}

  @Get(':productId/documents')
  @ApiOperation({ summary: 'Get documents for a product (public, only verified)' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'includeUnverified', required: false, type: Boolean })
  async findByProduct(
    @Param('productId') productId: string,
    @Query('includeUnverified') includeUnverified?: string,
  ) {
    const data = await this.service.findByProduct(
      productId,
      includeUnverified === 'true',
    );
    return { success: true, data };
  }

  @Get('documents/types')
  @ApiOperation({ summary: 'Get available document types' })
  async getTypes() {
    const data = await this.service.getDocumentTypes();
    return { success: true, data };
  }

  @Post(':productId/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a document to a product (seller only)' })
  @ApiParam({ name: 'productId' })
  async create(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProductDocumentDto,
  ) {
    const data = await this.service.create(productId, user.id, dto);
    return { success: true, message: 'Document uploaded', data };
  }

  @Put('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a document (seller only)' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateProductDocumentDto,
  ) {
    const data = await this.service.update(id, user.id, dto);
    return { success: true, message: 'Document updated', data };
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a document (seller only)' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.remove(id, user.id);
    return { success: true, message: 'Document removed' };
  }

  @Post('documents/:id/verify')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify or reject a document (admin)' })
  @ApiParam({ name: 'id' })
  async verify(
    @Param('id') id: string,
    @CurrentAdmin() admin: any,
    @Body() dto: VerifyProductDocumentDto,
  ) {
    // Attribution records the resolved admins row (request.admin), not the
    // users row that merely authenticates.
    const data = await this.service.verify(id, admin.id, dto);
    return { success: true, message: `Document ${dto.status.toLowerCase()}`, data };
  }
}