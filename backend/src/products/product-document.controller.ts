import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../common/storage/storage.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { ProductDocumentService } from './product-document.service';
import { UpdateProductDocumentDto, UploadProductDocumentDto, VerifyProductDocumentDto } from './dto/product-document.dto';
import { ProductDocumentType } from './entities/product-document.entity';

@ApiTags('Product Documents')
@Controller('products')
export class ProductDocumentController {
  constructor(
    private readonly service: ProductDocumentService,
    private readonly storage: StorageService,
  ) {}

  @Get(':productId/documents')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get documents for a product (verified are public; unverified only for the owner/admin)',
  })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'includeUnverified', required: false, type: Boolean })
  async findByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Query('includeUnverified') includeUnverified?: string,
  ) {
    // `includeUnverified` is only honoured for the owning seller or an admin;
    // otherwise this public route would list documents nobody has approved.
    const wantsUnverified =
      includeUnverified === 'true' && (await this.service.canSeeUnverified(productId, user));

    const data = await this.service.findByProduct(productId, wantsUnverified);
    return { success: true, data };
  }

  @Get('documents/types')
  @ApiOperation({ summary: 'Get available document types' })
  async getTypes() {
    const data = await this.service.getDocumentTypes();
    return { success: true, data };
  }

  /**
   * Upload a lot document. Multipart only: the size, MIME type and stored URL
   * are derived from the uploaded object rather than asserted by the client.
   */
  @Post(':productId/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for a product (seller only)' })
  @ApiParam({ name: 'productId' })
  async create(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() dto: UploadProductDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A file upload is required (form field "file")');
    }

    // Ownership first: a refused upload must not store bytes.
    await this.service.assertCanUpload(productId, user.id);

    const stored = await this.storage.uploadFile(file, 'products');
    try {
      const data = await this.service.createWithStoredFile(productId, user.id, dto, {
        url: stored.url,
        fileName: stored.filename,
        size: stored.size,
        mimeType: stored.mimetype,
      });
      return { success: true, message: 'Document uploaded', data };
    } catch (error) {
      // Never leave an orphaned object behind a rejected record.
      await this.storage.deleteFile(stored.url).catch(() => undefined);
      throw error;
    }
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