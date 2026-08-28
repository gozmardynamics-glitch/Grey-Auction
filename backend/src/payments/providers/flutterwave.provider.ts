import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/** Flutterwave adapter. Amounts are in NGN. Signature is the verif-hash header. */
export class FlutterwaveProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.FLUTTERWAVE;
  private readonly secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
  private readonly webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH || '';

  configured(): boolean { return Boolean(this.secretKey); }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return { message: 'Flutterwave not configured. Set FLUTTERWAVE_SECRET_KEY.', providerReference: txn.reference };
    }
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + this.secretKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txn.reference,
        amount: txn.amount,
        currency: txn.currency,
        redirect_url: txn.callbackUrl,
        customer: { email: txn.email },
        customizations: { title: 'Grey Auction' },
        meta: txn.metadata || {},
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error('Flutterwave init failed: ' + res.status);
    const data: any = await res.json();
    return {
      checkoutUrl: data?.data?.link,
      providerReference: data?.data?.id ? String(data.data.id) : undefined,
      message: 'Payment initialized with Flutterwave',
    };
  }

  async verify(reference: string): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING };
    const res = await fetch(
      'https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=' + encodeURIComponent(reference),
      { headers: { Authorization: 'Bearer ' + this.secretKey }, signal: AbortSignal.timeout(15000) },
    );
    const data: any = await res.json();
    const d = data?.data;
    return {
      verified: d?.status === 'successful',
      status: d?.status === 'successful' ? PaymentStatus.SUCCEEDED : d?.status === 'failed' ? PaymentStatus.FAILED : PaymentStatus.PENDING,
      providerReference: d?.id ? String(d.id) : undefined,
      amount: d?.amount !== undefined ? Number(d.amount) : undefined,
    };
  }

  parseWebhook(payload: unknown, headers: Record<string, string>): ProviderWebhookResult {
    const body: any = payload || {};
    const d = body?.data || {};
    const reference = d?.tx_ref || '';
    const providerReference = d?.id ? String(d.id) : undefined;
    const status =
      d?.status === 'successful'
        ? PaymentStatus.SUCCEEDED
        : d?.status === 'failed'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;
    // verif-hash header must match the configured webhook hash.
    const verified = this.webbookHashValidates(headers['verif-hash'] || '');
    return { verified, reference, providerReference, status, amount: d?.amount !== undefined ? Number(d.amount) : undefined };
  }

  private webbookHashValidates(header: string): boolean {
    return Boolean(this.webhookHash) && header === this.webhookHash;
  }
}
