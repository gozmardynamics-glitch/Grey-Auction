import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  StreamableFile,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  InvoiceService,
  GenerateInvoiceDto,
  MarkPaidDto,
} from './invoice.service';
import { InvoiceCronService } from './invoice-cron.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN];

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceCronService: InvoiceCronService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invoices (own; admin can filter by buyer/seller)' })
  async findAll(
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
    @CurrentUser() user?: any,
  ) {
    // S8: non-admins may only list their own invoices.
    if (user?.role !== 'admin') {
      if (user?.role === 'seller') sellerId = user.id;
      else buyerId = user.id;
    }
    const data = await this.invoiceService.findAll({ buyerId, sellerId });
    return { success: true, data };
  }

  @Post('settle-now')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually run auction settlement (admin)' })
  async settleNow() {
    const data = await this.invoiceCronService.runNow();
    return { success: true, message: 'Settlement complete', data };
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invoice totals summary (admin)' })
  async summary() {
    const data = await this.invoiceService.getSummary();
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice detail (party or admin)' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.requirePartyOrAdmin(id, user);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invoice (admin/system)' })
  async create(@Body() dto: GenerateInvoiceDto) {
    const data = await this.invoiceService.generateInvoice(dto);
    return { success: true, message: 'Invoice issued', data };
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an invoice as paid (admin)' })
  async markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    const data = await this.invoiceService.markPaid(id, dto);
    return { success: true, message: 'Invoice marked as paid', data };
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice as PDF (party or admin)' })
  async getPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
  ) {
    await this.requirePartyOrAdmin(id, user);
    const { buffer, filename } = await this.invoiceService.getPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length.toString());
    return new StreamableFile(buffer);
  }

  private async requirePartyOrAdmin(id: string, user: any) {
    const invoice = await this.invoiceService.findById(id);
    if (user?.role === 'admin') return invoice;
    if (invoice.buyer_id === user?.id || invoice.seller_id === user?.id) {
      return invoice;
    }
    throw new ForbiddenException('Not your invoice');
  }
}
