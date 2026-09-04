import { createHash } from 'crypto';
import { PaymentStatus } from '../entities/payment.entity';
import { InterswitchProvider } from './interswitch.provider';

describe('InterswitchProvider', () => {
  let provider: InterswitchProvider;
  const orig = {
    PRODUCT: process.env.INTERSWITCH_PRODUCT_ID,
    ITEM: process.env.INTERSWITCH_PAY_ITEM_ID,
    MAC: process.env.INTERSWITCH_MAC_KEY,
    HASH: process.env.INTERSWITCH_WEBHOOK_HASH,
  };

  beforeEach(() => {
    process.env.INTERSWITCH_PRODUCT_ID = 'PID-1';
    process.env.INTERSWITCH_PAY_ITEM_ID = 'ITEM-1';
    process.env.INTERSWITCH_MAC_KEY = 'MAC-KEY';
    delete process.env.INTERSWITCH_WEBHOOK_HASH;
    provider = new InterswitchProvider();
  });
  afterEach(() => {
    process.env.INTERSWITCH_PRODUCT_ID = orig.PRODUCT;
    process.env.INTERSWITCH_PAY_ITEM_ID = orig.ITEM;
    process.env.INTERSWITCH_MAC_KEY = orig.MAC;
    process.env.INTERSWITCH_WEBHOOK_HASH = orig.HASH;
  });

  it('builds the signed Webpay redirect checkout URL', async () => {
    const res = await provider.initialize({
      reference: 'REF-1',
      amount: 5000,
      currency: 'NGN',
      callbackUrl: 'https://app/callback',
    });
    const url = new URL(res.checkoutUrl!);
    expect(url.searchParams.get('productid')).toBe('PID-1');
    expect(url.searchParams.get('transactionreference')).toBe('REF-1');
    expect(url.searchParams.get('amount')).toBe('500000'); // kobo
    expect(url.searchParams.get('payitemid')).toBe('ITEM-1');
    expect(url.searchParams.get('hash')).toBe(
      createHash('sha512').update('PID-1' + 'REF-1' + 'MAC-KEY').digest('hex'),
    );
  });

  it('queries transaction status with the MAC header and maps 00 to succeeded', async () => {
    const spy = jest.spyOn(global, 'fetch').mockImplementation(async (url, init: any) => {
      expect(String(url)).toContain('gettransaction.json');
      expect(String(url)).toContain('productid=PID-1');
      expect(String(url)).toContain('transactionreference=REF-1');
      expect(String(url)).toContain('amount=500000');
      expect(init.headers.Hash).toBe(
        createHash('sha512').update('PID-1' + 'REF-1' + 'MAC-KEY').digest('hex'),
      );
      return {
        ok: true,
        json: async () => ({ ResponseCode: '00', Amount: 500000, PaymentReference: 'PR-9' }),
      } as any;
    });
    const res = await provider.verify('REF-1', { amount: 5000 });
    expect(res.verified).toBe(true);
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.providerReference).toBe('PR-9');
    expect(res.amount).toBe(5000);
    spy.mockRestore();
  });

  it('fails safe to PENDING when the original amount context is missing', async () => {
    const spy = jest.spyOn(global, 'fetch');
    const res = await provider.verify('REF-1');
    expect(res.verified).toBe(false);
    expect(res.status).toBe(PaymentStatus.PENDING);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('rejects an amount mismatch even on response code 00', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ResponseCode: '00', Amount: 999, PaymentReference: 'PR-9' }),
    } as any);
    const res = await provider.verify('REF-1', { amount: 5000 });
    expect(res.verified).toBe(false);
    expect(res.status).toBe(PaymentStatus.FAILED);
    spy.mockRestore();
  });

  it('fails webhook closed without INTERSWITCH_WEBHOOK_HASH', () => {
    const res = provider.parseWebhook(
      { txnref: 'REF-1', resp: '00', amount: 500000 },
      { 'verif-hash': 'whatever' },
    );
    expect(res.verified).toBe(false);
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('accepts the webhook when the shared-secret hash matches', () => {
    process.env.INTERSWITCH_WEBHOOK_HASH = 'whsec';
    const keyed = new InterswitchProvider();
    const res = keyed.parseWebhook(
      { txnref: 'REF-1', resp: '00', amount: 500000 },
      { 'verif-hash': 'whsec' },
    );
    expect(res.verified).toBe(true);
    expect(res.reference).toBe('REF-1');
  });

  it('returns an honest not-configured result without keys', async () => {
    process.env.INTERSWITCH_PRODUCT_ID = '';
    const unconfigured = new InterswitchProvider();
    const res = await unconfigured.initialize({ reference: 'REF-1', amount: 1, currency: 'NGN' });
    expect(res.message).toContain('Interswitch not configured');
    expect(res.checkoutUrl).toBeUndefined();
  });
});
