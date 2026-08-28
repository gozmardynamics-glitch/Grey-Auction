import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateAddressDto, UpdateAddressDto, CalculateRateDto, CreateShipmentDto, UpdateShipmentStatusDto,
} from './dto/shipping.dto';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My saved shipping addresses' })
  async addresses(@CurrentUser() user: any) {
    const data = await this.service.listAddresses(user.id);
    return { success: true, data };
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a shipping address' })
  async createAddress(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    const data = await this.service.createAddress(user.id, dto);
    return { success: true, data };
  }

  @Patch('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipping address' })
  async updateAddress(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    const data = await this.service.updateAddress(id, user.id, dto);
    return { success: true, data };
  }

  @Post('addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set an address as default' })
  async setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.service.setDefault(id, user.id);
    return { success: true, data };
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a shipping address' })
  async removeAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.removeAddress(id, user.id);
  }

  @Post('rates')
  @ApiOperation({ summary: 'Quote a delivery cost (key-free tiered calculator)' })
  async rate(@Body() dto: CalculateRateDto) {
    const data = await this.service.quote(dto);
    return { success: true, data };
  }

  @Post('shipments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipment for an invoice' })
  async createShipment(@CurrentUser() user: any, @Body() dto: CreateShipmentDto) {
    const data = await this.service.createShipment(user.id, dto);
    return { success: true, data };
  }

  @Get('shipments/invoice/:invoiceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Shipments for an invoice (parties only)' })
  async shipmentsForInvoice(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) {
    const data = await this.service.getForInvoice(invoiceId, user.id);
    return { success: true, data };
  }

  @Patch('shipments/:id/status')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.SUPPORT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipment status (admin)' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    const data = await this.service.updateStatus(id, dto);
    return { success: true, data };
  }
}
