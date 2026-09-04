import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentOrchestrationService } from './payment.orchestration.service';
import { InitPaymentDto } from './dto/init-payment.dto';
import { PaymentProvider } from './entities/payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly orchestration: PaymentOrchestrationService) {}

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payment providers and whether each is configured' })
  async providers() {
    return { success: true, data: this.orchestration.providersStatus() };
  }

  /* Legacy note: the old POST /payments/initialize, GET /payments/verify and
 * POST /payments/webhook endpoints were removed — they duplicated the
 * orchestration flow, exposed provider posture, and auto-settled invoices in
 * mock mode. Use POST /payments/init + POST /payments/webhook/:provider. */
/** Buyer picks a payment platform to pay an invoice or fund the wallet. */
  @Post('init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a payment with the buyer-chosen provider + type' })
  async init(@Body() dto: InitPaymentDto, @Req() req: any) {
    const result = await this.orchestration.initialize({
      userId: req.user.id,
      type: dto.type,
      provider: dto.provider,
      amount: dto.amount,
      invoiceId: dto.invoiceId,
      email: req.user?.email,
      callbackUrl: dto.callbackUrl,
      metadata: dto.metadata,
    });
    return { success: true, data: result };
  }

  /** Signature-validated, idempotent per-provider webhook. */
  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Per-provider payment webhook (signature-validated, idempotent)' })
  async providerWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!Object.values(PaymentProvider).includes(provider as PaymentProvider)) {
      throw new BadRequestException('Unknown payment provider: ' + provider);
    }
    const rawBody = req?.rawBody ? req.rawBody.toString() : JSON.stringify(body || {});
    const result = await this.orchestration.handleWebhook(
      provider as PaymentProvider,
      body,
      headers,
      rawBody,
    );
    return { success: true, data: result };
  }
}
