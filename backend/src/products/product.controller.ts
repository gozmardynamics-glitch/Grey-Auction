import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
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
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    const product = await this.productService.create(dto, user.id);
    return { success: true, message: 'Product created', data: product };
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
