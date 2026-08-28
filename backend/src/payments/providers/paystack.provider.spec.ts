import { PaymentStatus } from '../entities/payment.entity';
import { PaystackProvider } from './paystack.provider';

describe('PaystackProvider', () => {
  let provider: PaystackProvider;
  const original = process.env.PAYSTACK_SECRET_KEY;

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = 'test_key';
    provider = new PaystackProvider();
  });
  afterEach(() => {
    process.env.PAYSTACK_SECRET_KEY = original;
  });

  it('configured is true when a key is set', () => {
    expect(provider.configured()).toBe(true);
  });

  it('initialize returns a hosted checkout URL', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { authorization_url: 'https://paystack.com/pay', reference: 'REF' } }),
    } as any);
    const res = await provider.initialize({
      reference: 'REF', amount: 5000, currency: 'NGN', email: 'a@b.com',
    });
    expect(res.checkoutUrl).toBe('https://paystack.com/pay');
    expect(res.providerReference).toBe('REF');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('verify maps a successful transaction and converts kobo to naira', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { status: 'success', reference: 'REF', amount: 500000 } }),
    } as any);
    const res = await provider.verify('REF');
    expect(res.verified).toBe(true);
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.amount).toBe(5000);
    spy.mockRestore();
  });

  it('parseWebhook validates the HMAC-SHA512 signature', () => {
    const { createHmac } = require('crypto');
    const raw = JSON.stringify({ event: 'charge.success', data: { reference: 'REF', amount: 500000 } });
    const sig = createHmac('sha512', 'test_key').update(raw).digest('hex');
    const res = provider.parseWebhook(JSON.parse(raw), { 'x-paystack-signature': sig }, raw);
    expect(res.verified).toBe(true);
    expect(res.reference).toBe('REF');
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.amount).toBe(5000);
  });

  it('parseWebhook rejects a bad signature', () => {
    const res = provider.parseWebhook(
      { event: 'charge.success', data: { reference: 'REF' } },
      { 'x-paystack-signature': 'wrong' },
      JSON.stringify({ event: 'charge.success', data: { reference: 'REF' } }),
    );
    expect(res.verified).toBe(false);
  });
});
