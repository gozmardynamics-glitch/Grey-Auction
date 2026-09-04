import { createHash } from 'crypto';
import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import type {
  PaymentProviderAdapter,
  ProviderInitTxn,
  ProviderInitResult,
  ProviderVerifyResult,
  ProviderWebhookResult,
} from './payment-provider.interface';

/**
 * Interswitch Webpay Direct (PayDirect) adapter.
 *
 * Contract sources (Interswitch docbase — Webpay Direct "Redirect
 * Implementation" + "Getting Transaction Status"; canonical integration
 * pattern also embodied by the webpay_interswitch libraries):
 * - Checkout init is a signed redirect form to {gatewayUrl}
 *   (fields productid / transactionreference / amount(kobo) / currency /
 *   payitemid / site_redirect_url + hash). Webpay Direct has no JSON init
 *   API, so the adapter exposes the signed redirect URL as checkoutUrl.
 * - Transaction status query: GET {txnUrl}?productid=&transactionreference=&amount=
 *   with Hash header = SHA512(productid + transactionreference + mackey).
 *   Success response code is '00'; amount is in kobo and must match the
 *   original payment (the orchestration service forwards it).
 * - Amounts are in kobo (x100), same as Paystack.
 *
 * TODO(vendor): the IPN/notification signature scheme for this flow is not
 * publicly documented; webhooks are FAILED CLOSED (verified=false) unless
 * INTERSWITCH_WEBHOOK_HASH is configured (verif-hash style shared secret).
 * Confirm both in the vendor sandbox pass before enabling live traffic.
 */
export class InterswitchProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.INTERSWITCH;
  private readonly productId = process.env.INTERSWITCH_PRODUCT_ID || '';
  private readonly payItemId = process.env.INTERSWITCH_PAY_ITEM_ID || '';
  private readonly macKey = process.env.INTERSWITCH_MAC_KEY || '';
  private readonly gatewayUrl =
    process.env.INTERSWITCH_GATEWAY_URL || 'https://webpay.interswitchng.com/paydirect/webpay/pay';
  private readonly txnUrl =
    process.env.INTERSWITCH_TXN_URL || 'https://webpay.interswitchng.com/paydirect/api/v1/gettransaction.json';
  private readonly currencyCode = process.env.INTERSWITCH_CURRENCY_CODE || '566'; // ISO 4217 numeric, NGN
  private readonly webhookHash = process.env.INTERSWITCH_WEBHOOK_HASH || '';

  configured(): boolean {
    return Boolean(this.productId && this.payItemId && this.macKey);
  }

  async initialize(txn: ProviderInitTxn): Promise<ProviderInitResult> {
    if (!this.configured()) {
      return {
        message:
          'Interswitch not configured. Set INTERSWITCH_PRODUCT_ID / INTERSWITCH_PAY_ITEM_ID / INTERSWITCH_MAC_KEY.',
        providerReference: txn.reference,
      };
    }
    const kobo = Math.round(txn.amount * 100);
    const params = new URLSearchParams({
      productid: this.productId,
      transactionreference: txn.reference,
      amount: String(kobo),
      currency: this.currencyCode,
      payitemid: this.payItemId,
      ...(txn.callbackUrl ? { site_redirect_url: txn.callbackUrl } : {}),
      hash: this.sha512(this.productId + txn.reference + this.macKey),
    });
    return {
      checkoutUrl: this.gatewayUrl + '?' + params.toString(),
      providerReference: txn.reference,
      message: 'Interswitch Webpay redirect initialized',
    };
  }

  async verify(reference: string, options?: { amount?: number }): Promise<ProviderVerifyResult> {
    if (!this.configured()) return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    // The status query MAC covers the product, reference and MAC key; the
    // amount must echo the original payment in kobo — without it the gateway
    // cannot reconcile the transaction, so fail safe as PENDING.
    if (options?.amount === undefined) {
      return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    }
    const kobo = Math.round(options.amount * 100);
    const params = new URLSearchParams({
      productid: this.productId,
      transactionreference: reference,
      amount: String(kobo),
    });
    const res = await fetch(this.txnUrl + '?' + params.toString(), {
      headers: { Hash: this.sha512(this.productId + reference + this.macKey) },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { verified: false, status: PaymentStatus.PENDING, providerReference: reference };
    const data: any = await res.json();
    const respCode = String(data?.ResponseCode ?? '');
    const returnedKobo = data?.Amount !== undefined ? Number(data.Amount) : undefined;
    const amountMatches = returnedKobo === undefined || returnedKobo === kobo;
    const succeeded = respCode === '00' && amountMatches;
    return {
      verified: succeeded,
      status: respCode === '00' && !amountMatches ? PaymentStatus.FAILED : this.mapStatus(respCode),
      providerReference: data?.PaymentReference || reference,
      amount: returnedKobo !== undefined ? returnedKobo / 100 : undefined,
    };
  }

  parseWebhook(payload: unknown, headers: Record<string, string>, _rawBody?: string): ProviderWebhookResult {
    const body: any = payload || {};
    const reference = body?.txnref || body?.TransactionReference || body?.reference || '';
    const code = String(body?.resp ?? body?.ResponseCode ?? body?.status ?? '');
    const status = this.mapStatus(code);
    // Shared-secret header validation (verif-hash style), mirroring the
    // Flutterwave adapter. Failed closed unless INTERSWITCH_WEBHOOK_HASH is set.
    const verified = Boolean(this.webhookHash) && headers['verif-hash'] === this.webhookHash;
    return {
      verified,
      reference,
      status,
      amount: body?.amount !== undefined ? Number(body.amount) : undefined,
    };
  }

  private sha512(message: string): string {
    return createHash('sha512').update(message).digest('hex');
  }

  private mapStatus(code: string): PaymentStatus {
    if (code === '00' || code.toLowerCase() === 'successful' || code.toLowerCase() === 'success') {
      return PaymentStatus.SUCCEEDED;
    }
    if (!code) return PaymentStatus.PENDING;
    return PaymentStatus.PENDING;
  }
}
