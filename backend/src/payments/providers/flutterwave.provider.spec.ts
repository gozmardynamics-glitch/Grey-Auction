import { PaymentStatus } from '../entities/payment.entity';
import { FlutterwaveProvider } from './flutterwave.provider';

describe('FlutterwaveProvider', () => {
  let provider: FlutterwaveProvider;
  const origKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const origHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

  beforeEach(() => {
    process.env.FLUTTERWAVE_SECRET_KEY = 'fw_key';
    process.env.FLUTTERWAVE_WEBHOOK_HASH = 'webhook_hash';
    provider = new FlutterwaveProvider();
  });
  afterEach(() => {
    process.env.FLUTTERWAVE_SECRET_KEY = origKey;
    process.env.FLUTTERWAVE_WEBHOOK_HASH = origHash;
  });

  it('initializes via the v3 payments endpoint', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { link: 'https://flutterwave.com/checkout', id: 123 } }),
    } as any);
    const res = await provider.initialize({ reference: 'REF', amount: 5000, currency: 'NGN', email: 'a@b.com' });
    expect(res.checkoutUrl).toBe('https://flutterwave.com/checkout');
    expect(res.providerReference).toBe('123');
    spy.mockRestore();
  });

  it('validates webhooks via the verif-hash header', () => {
    const res = provider.parseWebhook(
      { data: { tx_ref: 'REF', status: 'successful', amount: '5000', id: 99 } },
      { 'verif-hash': 'webhook_hash' },
    );
    expect(res.verified).toBe(true);
    expect(res.reference).toBe('REF');
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.amount).toBe(5000);
  });

  it('rejects a webhook with a mismatched hash', () => {
    const res = provider.parseWebhook(
      { data: { tx_ref: 'REF', status: 'successful' } },
      { 'verif-hash': 'nope' },
    );
    expect(res.verified).toBe(false);
  });
});
