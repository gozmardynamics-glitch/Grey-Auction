import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  PaymentGatewayService,
  InitializePaymentDto,
} from './payment-gateway.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceService } from '../invoices/invoice.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly gateway: PaymentGatewayService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a payment (Flutterwave/Paystack/mock)' })
  async initialize(@Body() dto: InitializePaymentDto) {
    const result = await this.gateway.initializePayment(dto);

    // In mock mode, auto-mark the linked invoice as paid so the flow completes
    if (!result.configured && dto.invoiceId) {
      await this.invoiceService
        .markPaid(dto.invoiceId, {
          paymentMethod: 'Mock Payment',
          paymentReference: dto.reference,
        })
        .catch(() => {});
    }

    return { success: true, data: result };
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify a payment by reference' })
  async verify(@Query('reference') reference: string) {
    const result = await this.gateway.verifyPayment(reference);
    return { success: true, data: result };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment gateway webhook (Flutterwave/Paystack)' })
  async webhook(
    @Headers('x-webhook-signature') signature: string,
    @Headers('verif-hash') flutterwaveHash: string,
    @Body() body: any,
  ) {
    // Extract reference from either provider's webhook payload
    const reference =
      body?.data?.tx_ref ||
      body?.data?.reference ||
      body?.reference ||
      '';

    // Never auto-verify via webhook in mock mode: without a real provider
    // the gateway reports every reference as verified, which would let an
    // unauthenticated request mark arbitrary invoices paid. Real providers are
    // verified by calling back to the gateway (and optionally the signature).
    if (reference && this.gateway.isConfigured()) {
      const result = await this.gateway.verifyPayment(
        reference,
        signature || flutterwaveHash,
      );
      if (result.verified) {
        // Targeted lookup by payment reference — avoid scanning the whole table
        const invoice = await this.invoiceService.findByPaymentReference(
          reference,
        );
        if (invoice) {
          await this.invoiceService.markPaid(invoice.id, {
            paymentMethod: body?.data?.payment_type || 'Gateway',
            paymentReference: reference,
          });
        }
      }
      return { success: true, data: result };
    }

    if (!reference) {
      return { success: true, data: { verified: false, message: 'No reference found' } };
    }
    // A reference exists but no provider is configured — do not auto-verify.
    return {
      success: true,
      data: {
        verified: false,
        message: 'Payment gateway not configured; webhook ignored',
      },
    };
  }
}
