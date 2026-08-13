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

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceCronService: InvoiceCronService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List invoices (filter by buyerId or sellerId)' })
  async findAll(
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    const data = await this.invoiceService.findAll({ buyerId, sellerId });
    return { success: true, data };
  }

  @Post('settle-now')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually run auction settlement (admin)' })
  async settleNow() {
    const data = await this.invoiceCronService.runNow();
    return { success: true, message: 'Settlement complete', data };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Invoice totals summary' })
  async summary() {
    const data = await this.invoiceService.getSummary();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail' })
  async findById(@Param('id') id: string) {
    const data = await this.invoiceService.findById(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invoice (admin/system)' })
  async create(@Body() dto: GenerateInvoiceDto) {
    const data = await this.invoiceService.generateInvoice(dto);
    return { success: true, message: 'Invoice issued', data };
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  async markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    const data = await this.invoiceService.markPaid(id, dto);
    return { success: true, message: 'Invoice marked as paid', data };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  async getPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.invoiceService.getPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length.toString());
    return new StreamableFile(buffer);
  }
}
