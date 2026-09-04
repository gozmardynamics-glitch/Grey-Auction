import { createHmac } from 'crypto';
import { PaymentStatus } from '../entities/payment.entity';
import { OpayProvider } from './opay.provider';

describe('OpayProvider', () => {
  let provider: OpayProvider;
  const orig = {
    MERCHANT: process.env.OPAY_MERCHANT_ID,
    PUBLIC: process.env.OPAY_PUBLIC_KEY,
    PRIVATE: process.env.OPAY_PRIVATE_KEY,
    SECRET: process.env.OPAY_SECRET_KEY,
  };

  beforeEach(() => {
    process.env.OPAY_MERCHANT_ID = '256612345678901';
    process.env.OPAY_PUBLIC_KEY = 'OPAY-PUB';
    process.env.OPAY_PRIVATE_KEY = 'OPAY-PRIV';
    delete process.env.OPAY_SECRET_KEY;
    provider = new OpayProvider();
  });
  afterEach(() => {
    process.env.OPAY_MERCHANT_ID = orig.MERCHANT;
    process.env.OPAY_PUBLIC_KEY = orig.PUBLIC;
    process.env.OPAY_PRIVATE_KEY = orig.PRIVATE;
    process.env.OPAY_SECRET_KEY = orig.SECRET;
  });

  it('initializes via /cashier/create and maps cashierUrl + orderNo', async () => {
    let captured: { url: string; headers: any; body: any } | null = null;
    const spy = jest.spyOn(global, 'fetch').mockImplementation(async (url, init: any) => {
      captured = { url: String(url), headers: init.headers, body: JSON.parse(init.body) };
      return {
        ok: true,
        json: async () => ({
          code: '00000',
          message: 'SUCCESSFUL',
          data: { cashierUrl: 'https://pay.opaycheckout.com/x', orderNo: 'O123', reference: 'REF' },
        }),
      } as any;
    });
    const res = await provider.initialize({
      reference: 'REF',
      amount: 5000,
      currency: 'NGN',
      email: 'a@b.com',
      callbackUrl: 'https://app/callback',
    });
    expect(res.checkoutUrl).toBe('https://pay.opaycheckout.com/x');
    expect(res.providerReference).toBe('O123');
    expect(captured!.url).toContain('/cashier/create');
    expect(captured!.headers.Authorization).toBe('Bearer OPAY-PUB');
    expect(captured!.headers.MerchantId).toBe('256612345678901');
    expect(captured!.body.amount).toEqual({ total: 500000, currency: 'NGN' });
    expect(captured!.body.reference).toBe('REF');
    spy.mockRestore();
  });

  it('signs /cashier/status with HMAC-SHA512 of the body and maps SUCCESS', async () => {
    const expectedBody = JSON.stringify({ reference: 'REF', country: 'NG' });
    const expectedSig = createHmac('sha512', 'OPAY-PRIV').update(expectedBody).digest('hex');
    const spy = jest.spyOn(global, 'fetch').mockImplementation(async (url, init: any) => {
      expect(String(url)).toContain('/cashier/status');
      expect(init.body).toBe(expectedBody);
      expect(init.headers.Authorization).toBe('Bearer ' + expectedSig);
      return {
        ok: true,
        json: async () => ({
          code: '00000',
          data: { reference: 'REF', orderNo: 'O123', status: 'SUCCESS', amount: { total: 500000, currency: 'NGN' } },
        }),
      } as any;
    });
    const res = await provider.verify('REF');
    expect(res.verified).toBe(true);
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.providerReference).toBe('O123');
    expect(res.amount).toBe(5000);
    spy.mockRestore();
  });

  it('treats FAIL/CLOSE as failed and unknown statuses as pending', async () => {
    for (const [status, expected] of [
      ['FAIL', PaymentStatus.FAILED],
      ['CLOSE', PaymentStatus.FAILED],
      ['PENDING', PaymentStatus.PENDING],
      ['INITIAL', PaymentStatus.PENDING],
    ] as const) {
      const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ code: '00000', data: { reference: 'REF', status } }),
      } as any);
      const res = await provider.verify('REF');
      expect(res.status).toBe(expected);
      if (status !== 'PENDING' && status !== 'INITIAL') expect(res.verified).toBe(false);
      spy.mockRestore();
    }
  });

  it('returns an honest not-configured result without keys', async () => {
    process.env.OPAY_MERCHANT_ID = '';
    const unconfigured = new OpayProvider();
    const spy = jest.spyOn(global, 'fetch');
    const res = await unconfigured.initialize({ reference: 'REF', amount: 1, currency: 'NGN' });
    expect(res.message).toContain('OPay not configured');
    expect(res.checkoutUrl).toBeUndefined();
    const v = await unconfigured.verify('REF');
    expect(v.verified).toBe(false);
    expect(v.status).toBe(PaymentStatus.PENDING);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('fails webhook closed without a valid signature', () => {
    const payload = { reference: 'REF', status: 'SUCCESS', amount: { total: 500000, currency: 'NGN' } };
    const res = provider.parseWebhook(payload, { 'x-opay-signature': 'deadbeef' });
    expect(res.verified).toBe(false);
    expect(res.reference).toBe('REF');
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('accepts a webhook whose signature matches the raw body HMAC', () => {
    const rawBody = JSON.stringify({ reference: 'REF', status: 'SUCCESS' });
    const sig = createHmac('sha512', 'OPAY-PRIV').update(rawBody).digest('hex');
    const res = provider.parseWebhook(JSON.parse(rawBody), { 'x-opay-signature': sig }, rawBody);
    expect(res.verified).toBe(true);
  });
});
