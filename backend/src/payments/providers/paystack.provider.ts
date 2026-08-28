import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import { createHmac } from 'crypto';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/** Paystack adapter. Amounts are in NGN; Paystack uses kobo (x100). */
export class PaystackProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.PAYSTACK;
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY || '';

  configured(): boolean { return Boolean(this.secretKey); }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return { message: 'Paystack not configured. Set PAYSTACK_SECRET_KEY.', providerReference: txn.reference };
    }
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + this.secretKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: txn.email,
        amount: Math.round(txn.amount * 100),
        currency: txn.currency,
        reference: txn.reference,
        callback_url: txn.callbackUrl,
        metadata: txn.metadata || {},
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error('Paystack init failed: ' + res.status);
    const data: any = await res.json();
    return {
      checkoutUrl: data?.data?.authorization_url,
      providerReference: data?.data?.reference,
      message: 'Payment initialized with Paystack',
    };
  }

  async verify(reference: string): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING };
    const res = await fetch(
      'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
      { headers: { Authorization: 'Bearer ' + this.secretKey }, signal: AbortSignal.timeout(15000) },
    );
    const data: any = await res.json();
    return {
      verified: data?.data?.status === 'success',
      status: this.mapStatus(data?.data?.status),
      providerReference: data?.data?.reference,
      amount: data?.data?.amount ? Number(data.data.amount) / 100 : undefined,
    };
  }

  parseWebhook(payload: unknown, headers: Record<string, string>, rawBody?: string): ProviderWebhookResult {
    const body: any = payload || {};
    const reference = body?.data?.reference || '';
    const providerReference = body?.data?.reference;
    const status =
      body?.event === 'charge.success'
        ? PaymentStatus.SUCCEEDED
        : body?.event === 'charge.failed'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;
    const sig = headers['x-paystack-signature'] || '';
    const bodyStr = rawBody !== undefined ? rawBody : JSON.stringify(body);
    const verified = this.secretKey ? Boolean(sig) && this.verifySignature(bodyStr, sig) : false;
    return {
      verified,
      reference,
      providerReference,
      status,
      amount: body?.data?.amount ? Number(body.data.amount) / 100 : undefined,
    };
  }

  private mapStatus(s: string): PaymentStatus {
    return s === 'success' ? PaymentStatus.SUCCEEDED : s === 'failed' ? PaymentStatus.FAILED : PaymentStatus.PENDING;
  }

  private verifySignature(body: string, sig: string): boolean {
    const hmac = createHmac('sha512', this.secretKey).update(body).digest('hex');
    return hmac === sig;
  }
}
