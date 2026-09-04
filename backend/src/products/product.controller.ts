import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ProductApiResponseDto } from './dto/product-response.dto';
import { ProductService } from './product.service';
import { csvToObjects, parseCsv } from './csv-parser';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ApproveProductDto, RejectProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product listing' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created', type: ProductApiResponseDto })
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    const product = await this.productService.create(dto, user.id);
    return { success: true, message: 'Product created', data: product };
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  // Memory-stored uploads are capped: without limits any authenticated user
  // could stream an unbounded body into RAM (memory-exhaustion DoS).
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        const ok = /^text\/csv$|^application\/vnd\.ms-excel$/.test(file.mimetype);
        cb(ok ? null : new BadRequestException('Only CSV files are allowed'), ok);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk-create products from a CSV file' })
  async bulkUpload(
    @UploadedFile() file: { buffer: Buffer },
    @CurrentUser() user: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('CSV file is required');
    }
    const rows = parseCsv(file.buffer.toString('utf8'));
    const { data, errors } = csvToObjects(rows);
    if (errors.length > 0) {
      throw new BadRequestException(errors[0]);
    }
    if (data.length > 500) {
      throw new BadRequestException('Bulk import is limited to 500 rows per file');
    }
    const result = await this.productService.bulkCreate(data, user.id);
    return {
      success: true,
      message: `Created ${result.created.length} product(s), ${result.errors.length} row(s) failed`,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured auctions' })
  async getFeatured() {
    const data = await this.productService.getFeatured();
    return data;
  }

  @Get('related')
  @ApiOperation({ summary: 'Get related auctions by category' })
  async getRelated(
    @Query('category') category: string,
    @Query('exclude') excludeId?: string,
    @Query('limit') limit?: number,
  ) {
    const data = await this.productService.getRelated(category, excludeId, limit || 4);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product found', type: ProductApiResponseDto })
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findByIdOrSlug(id);
    return { success: true, data: product };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    const product = await this.productService.update(id, dto, user.id);
    return { success: true, message: 'Product updated', data: product };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.productService.remove(id, user.id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve product (Admin)' })
  async approve(@Param('id') id: string, @Body() dto: ApproveProductDto, @CurrentUser() admin: any) {
    const product = await this.productService.approve(id, dto, admin.id);
    return { success: true, message: 'Product approved', data: product };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject product (Admin)' })
  async reject(@Param('id') id: string, @Body() dto: RejectProductDto, @CurrentUser() admin: any) {
    const product = await this.productService.reject(id, dto, admin.id);
    return { success: true, message: 'Product rejected', data: product };
  }
}