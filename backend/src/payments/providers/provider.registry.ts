import { PaymentProvider } from '../entities/payment.entity';
import type { PaymentProviderAdapter } from './payment-provider.interface';
import { PaystackProvider } from './paystack.provider';
import { FlutterwaveProvider } from './flutterwave.provider';
import { InterswitchProvider } from './interswitch.provider';
import { OpayProvider } from './opay.provider';

export function createProviderAdapter(provider: PaymentProvider): PaymentProviderAdapter {
  switch (provider) {
    case PaymentProvider.PAYSTACK:
      return new PaystackProvider();
    case PaymentProvider.FLUTTERWAVE:
      return new FlutterwaveProvider();
    case PaymentProvider.INTERSWITCH:
      return new InterswitchProvider();
    case PaymentProvider.OPAY:
      return new OpayProvider();
    default:
      throw new Error('Unknown payment provider: ' + String(provider));
  }
}
