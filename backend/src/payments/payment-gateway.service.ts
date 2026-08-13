import { Injectable, Logger } from '@nestjs/common';

export interface InitializePaymentDto {
  amount: number; // in NGN
  email: string;
  reference: string; // unique transaction reference
  currency?: string;
  metadata?: Record<string, unknown>;
  invoiceId?: string;
}

export interface InitializePaymentResult {
  configured: boolean;
  provider: string;
  checkoutUrl?: string;
  reference: string;
  message: string;
}

/**
 * Payment gateway service.
 *
 * Providers (env-driven — when keys are absent, payments run in mock mode):
 *   FLUTTERWAVE_SECRET_KEY — Flutterwave secret key (primary)
 *   PAYSTACK_SECRET_KEY   — Paystack secret key (fallback)
 *
 * When neither key is set, initializePayment returns a mock success so the
 * checkout flow can be exercised end-to-end without real credentials.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  private readonly flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
  private readonly paystackKey = process.env.PAYSTACK_SECRET_KEY || '';

  isConfigured(): boolean {
    return Boolean(this.flutterwaveKey || this.paystackKey);
  }

  activeProvider(): string {
    if (this.flutterwaveKey) return 'flutterwave';
    if (this.paystackKey) return 'paystack';
    return 'mock';
  }

  async initializePayment(
    dto: InitializePaymentDto,
  ): Promise<InitializePaymentResult> {
    const provider = this.activeProvider();

    if (provider === 'flutterwave') {
      return this.initFlutterwave(dto);
    }
    if (provider === 'paystack') {
      return this.initPaystack(dto);
    }

    // Mock mode — no credentials configured
    this.logger.warn(
      `Payment ${dto.reference} for ${dto.amount} ${dto.currency || 'NGN'} from ${dto.email} — MOCK mode (no gateway keys configured)`,
    );
    return {
      configured: false,
      provider: 'mock',
      reference: dto.reference,
      message:
        'Payment gateway not configured. Transaction recorded in mock mode.',
    };
  }

  private async initFlutterwave(
    dto: InitializePaymentDto,
  ): Promise<InitializePaymentResult> {
    try {
      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.flutterwaveKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: dto.reference,
          amount: dto.amount,
          currency: dto.currency || 'NGN',
          redirect_url:
            process.env.FRONTEND_URL || 'http://localhost:3000',
          customer: { email: dto.email },
          customizations: { title: 'Grey Auction' },
          meta: dto.metadata || {},
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => 'Unknown error');
        throw new Error(`Flutterwave ${res.status}: ${err}`);
      }

      const data: any = await res.json();
      return {
        configured: true,
        provider: 'flutterwave',
        checkoutUrl: data?.data?.link,
        reference: dto.reference,
        message: 'Payment initialized with Flutterwave',
      };
    } catch (error: any) {
      this.logger.error(`Flutterwave init failed: ${error.message}`);
      return {
        configured: true,
        provider: 'flutterwave',
        reference: dto.reference,
        message: `Flutterwave init failed: ${error.message}`,
      };
    }
  }

  private async initPaystack(
    dto: InitializePaymentDto,
  ): Promise<InitializePaymentResult> {
    try {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: dto.email,
          amount: Math.round(dto.amount * 100), // Paystack uses kobo
          currency: dto.currency || 'NGN',
          reference: dto.reference,
          callback_url: process.env.FRONTEND_URL || 'http://localhost:3000',
          metadata: dto.metadata || {},
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => 'Unknown error');
        throw new Error(`Paystack ${res.status}: ${err}`);
      }

      const data: any = await res.json();
      return {
        configured: true,
        provider: 'paystack',
        checkoutUrl: data?.data?.authorization_url,
        reference: dto.reference,
        message: 'Payment initialized with Paystack',
      };
    } catch (error: any) {
      this.logger.error(`Paystack init failed: ${error.message}`);
      return {
        configured: true,
        provider: 'paystack',
        reference: dto.reference,
        message: `Paystack init failed: ${error.message}`,
      };
    }
  }

  /**
   * Verify a transaction via webhook signature or reference lookup.
   * In mock mode, always returns success.
   */
  async verifyPayment(
    reference: string,
    signature?: string,
  ): Promise<{ verified: boolean; reference: string; message: string }> {
    const provider = this.activeProvider();

    if (provider === 'mock') {
      return { verified: true, reference, message: 'Mock verification passed' };
    }

    if (provider === 'flutterwave') {
      try {
        const res = await fetch(
          `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
          {
            headers: { Authorization: `Bearer ${this.flutterwaveKey}` },
            signal: AbortSignal.timeout(15000),
          },
        );
        const data: any = await res.json();
        const verified = data?.data?.status === 'successful';
        return {
          verified,
          reference,
          message: verified ? 'Payment verified' : 'Payment not verified',
        };
      } catch (error: any) {
        return { verified: false, reference, message: error.message };
      }
    }

    try {
      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${this.paystackKey}` },
          signal: AbortSignal.timeout(15000),
        },
      );
      const data: any = await res.json();
      const verified = data?.data?.status === 'success';
      return {
        verified,
        reference,
        message: verified ? 'Payment verified' : 'Payment not verified',
      };
    } catch (error: any) {
      return { verified: false, reference, message: error.message };
    }
  }
}
