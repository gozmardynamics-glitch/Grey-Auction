import { PaymentProvider } from '../entities/payment.entity';
import { createProviderAdapter } from './provider.registry';
import { PaystackProvider } from './paystack.provider';
import { FlutterwaveProvider } from './flutterwave.provider';
import { InterswitchProvider } from './interswitch.provider';
import { OpayProvider } from './opay.provider';

describe('createProviderAdapter', () => {
  it('maps each provider to its adapter', () => {
    expect(createProviderAdapter(PaymentProvider.PAYSTACK)).toBeInstanceOf(PaystackProvider);
    expect(createProviderAdapter(PaymentProvider.FLUTTERWAVE)).toBeInstanceOf(FlutterwaveProvider);
    expect(createProviderAdapter(PaymentProvider.INTERSWITCH)).toBeInstanceOf(InterswitchProvider);
    expect(createProviderAdapter(PaymentProvider.OPAY)).toBeInstanceOf(OpayProvider);
  });
});
