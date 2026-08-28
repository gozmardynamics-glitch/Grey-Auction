import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/**
 * Interswitch (InterswitchCollect / Quickteller) adapter.
 * Account/transfer-based. The exact init contract depends on the product the
 * merchant is onboarded to; this is a working skeleton with placeholder env
 * slots. Real initialize/verify logic should be completed against the vendor
 * contract (and verified in sandbox) once keys are provided.
 */
export class InterswitchProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.INTERSWITCH;
  private readonly clientId = process.env.INTERSWITCH_CLIENT_ID || '';
  private readonly secret = process.env.INTERSWITCH_CLIENT_SECRET || '';

  configured(): boolean { return Boolean(this.clientId && this.secret); }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return {
        message: 'Interswitch not configured. Set INTERSWITCH_CLIENT_ID / INTERSWITCH_CLIENT_SECRET.',
        providerReference: txn.reference,
      };
    }
    // TODO(vendor): confirm InterswitchCollect/Quickteller init contract.
    return {
      paymentInstruction:
        'Transfer the exact amount to the Interswitch collection account and use reference ' + txn.reference + '.',
      providerReference: txn.reference,
      message: 'Interswitch transfer instruction generated',
    };
  }

  async verify(reference: string): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING };
    // TODO(vendor): confirm Interswitch verify-by-reference endpoint.
    return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
  }

  parseWebhook(payload: unknown, _headers: Record<string, string>): ProviderWebhookResult {
    const body: any = payload || {};
    const reference = body?.reference || body?.transactionReference || '';
    const status =
      body?.status === 'successful' || body?.status === 'success'
        ? PaymentStatus.SUCCEEDED
        : body?.status === 'failed'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;
    // TODO(vendor): confirm Interswitch webhook signature scheme.
    return { verified: false, reference, status, amount: body?.amount ? Number(body.amount) : undefined };
  }
}
