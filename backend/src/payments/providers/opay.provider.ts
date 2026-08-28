import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/**
 * OPay merchant adapter. Account/transfer-based with hosted/card options.
 * Skeleton with placeholder env slots; complete the init/verify contract
 * against the OPay merchant docs once keys are provided.
 */
export class OpayProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.OPAY;
  private readonly merchantId = process.env.OPAY_MERCHANT_ID || '';
  private readonly secret = process.env.OPAY_SECRET_KEY || '';

  configured(): boolean { return Boolean(this.merchantId && this.secret); }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return {
        message: 'OPay not configured. Set OPAY_MERCHANT_ID / OPAY_SECRET_KEY.',
        providerReference: txn.reference,
      };
    }
    // TODO(vendor): confirm OPay checkout/transfer init contract.
    return {
      paymentInstruction: 'Pay via the OPay checkout. Reference: ' + txn.reference + '.',
      providerReference: txn.reference,
      message: 'OPay payment instruction generated',
    };
  }

  async verify(reference: string): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING };
    // TODO(vendor): confirm OPay verify endpoint.
    return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
  }

  parseWebhook(payload: unknown, _headers: Record<string, string>): ProviderWebhookResult {
    const body: any = payload || {};
    const reference = body?.reference || body?.orderId || '';
    const status =
      body?.status === 'success' || body?.status === 'SUCCESS'
        ? PaymentStatus.SUCCEEDED
        : body?.status === 'failed' || body?.status === 'FAILED'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;
    // TODO(vendor): confirm OPay webhook signature scheme.
    return { verified: false, reference, status, amount: body?.amount ? Number(body.amount) : undefined };
  }
}
