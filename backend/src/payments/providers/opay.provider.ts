import { createHmac } from 'crypto';
import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/**
 * OPay Cashier API adapter (merchant API v1).
 *
 * Contract source: OPay Cashier API OpenAPI (doc.opaycheckout.com —
 * https://liveapi.opaycheckout.com/api/v1/international):
 * - POST /cashier/create — Bearer = merchant PUBLIC key + MerchantId header.
 *   Body { reference, country, product:{name}, amount:{total,currency},
 *   returnUrl, callbackUrl } -> { code:'00000', data:{ cashierUrl, orderNo } }.
 * - POST /cashier/status — Bearer = HMAC-SHA512(privateKey, raw JSON body)
 *   + MerchantId header. Body { reference } -> { code, data:{ status, amount } }.
 * - Amounts are in the smallest currency unit (kobo), same as Paystack.
 * - Order status enum: INITIAL | PENDING | SUCCESS | FAIL | CLOSE.
 *
 * TODO(vendor): the webhook signature scheme is not in the public OpenAPI.
 * Webhooks are parsed but FAILED CLOSED (verified=false); the reconciliation
 * cron re-confirms every payment via /cashier/status, which is authoritative.
 * The signature header name defaults to x-opay-signature (env-overridable)
 * so the sandbox pass only needs to flip verification on.
 */
export class OpayProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.OPAY;
  private readonly merchantId = process.env.OPAY_MERCHANT_ID || '';
  private readonly publicKey = process.env.OPAY_PUBLIC_KEY || '';
  private readonly privateKey = process.env.OPAY_PRIVATE_KEY || process.env.OPAY_SECRET_KEY || '';
  private readonly baseUrl =
    process.env.OPAY_BASE_URL || 'https://liveapi.opaycheckout.com/api/v1/international';
  private readonly country = process.env.OPAY_COUNTRY || 'NG';
  private readonly webhookHeader = (process.env.OPAY_WEBHOOK_SIGNATURE_HEADER || 'x-opay-signature').toLowerCase();

  configured(): boolean {
    return Boolean(this.merchantId && this.publicKey && this.privateKey);
  }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return {
        message:
          'OPay not configured. Set OPAY_MERCHANT_ID / OPAY_PUBLIC_KEY / OPAY_PRIVATE_KEY.',
        providerReference: txn.reference,
      };
    }
    const body = {
      reference: txn.reference,
      country: this.country,
      product: { name: 'GreyAuction order ' + txn.reference },
      amount: { total: Math.round(txn.amount * 100), currency: txn.currency },
      returnUrl: txn.callbackUrl,
      callbackUrl: txn.callbackUrl,
      ...(txn.email ? { userInfo: { userEmail: txn.email } } : {}),
    };
    const res = await fetch(this.baseUrl + '/cashier/create', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.publicKey,
        MerchantId: this.merchantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error('OPay init failed: ' + res.status);
    const data: any = await res.json();
    if (data?.code !== '00000') {
      throw new Error('OPay init rejected: ' + (data?.message || data?.code || 'unknown'));
    }
    return {
      checkoutUrl: data?.data?.cashierUrl,
      providerReference: data?.data?.orderNo || txn.reference,
      message: 'Payment initialized with OPay',
    };
  }

  async verify(reference: string, _options?: { amount?: number }): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    const body = JSON.stringify({ reference, country: this.country });
    const signature = createHmac('sha512', this.privateKey).update(body).digest('hex');
    const res = await fetch(this.baseUrl + '/cashier/status', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + signature,
        MerchantId: this.merchantId,
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    const data: any = await res.json();
    if (data?.code !== '00000') {
      return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    }
    const d = data?.data || {};
    const status = this.mapStatus(d.status);
    return {
      verified: status === PaymentStatus.SUCCEEDED,
      status,
      providerReference: d.orderNo || reference,
      amount: d.amount?.total !== undefined ? Number(d.amount.total) / 100 : undefined,
    };
  }

  parseWebhook(payload: unknown, headers: Record<string, string>, rawBody?: string): ProviderWebhookResult {
    const body: any = payload || {};
    const reference = body?.reference || body?.orderId || '';
    const status = this.mapStatus(body?.status);
    const sig = (headers[this.webhookHeader] || '').toLowerCase();
    const bodyStr = rawBody !== undefined ? rawBody : JSON.stringify(body);
    const expected = createHmac('sha512', this.privateKey).update(bodyStr).digest('hex');
    const verified = this.configured() ? Boolean(sig) && sig === expected : false;
    return {
      verified,
      reference,
      status,
      amount:
        body?.amount?.total !== undefined
          ? Number(body.amount.total) / 100
          : body?.amount !== undefined
            ? Number(body.amount)
            : undefined,
    };
  }

  private mapStatus(s: string | undefined): PaymentStatus {
    switch (s) {
      case 'SUCCESS':
        return PaymentStatus.SUCCEEDED;
      case 'FAIL':
      case 'CLOSE':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING; // INITIAL / PENDING / unknown
    }
  }
}
