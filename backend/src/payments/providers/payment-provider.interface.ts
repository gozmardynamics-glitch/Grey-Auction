import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';

export interface ProviderInitTxn {
  reference: string;
  amount: number;
  currency: string;
  email?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderInitResult {
  /** Hosted checkout URL (redirect providers). */
  checkoutUrl?: string;
  /** Human instruction for transfer/account-based flows. */
  paymentInstruction?: string;
  providerReference?: string;
  message?: string;
}

export interface ProviderVerifyResult {
  verified: boolean;
  status: PaymentStatus;
  providerReference?: string;
  amount?: number;
}

export interface ProviderWebhookResult {
  /** True if the webhook signature validated. */
  verified: boolean;
  reference: string;
  providerReference?: string;
  status: PaymentStatus;
  amount?: number;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  /** True once the provider's credentials are configured. */
  configured(): boolean;
  initialize(txn: ProviderInitTxn): Promise<ProviderInitResult>;
  verify(reference: string): Promise<ProviderVerifyResult>;
  /** Parse + signature-validate a provider webhook. */
  parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
    rawBody?: string,
  ): ProviderWebhookResult;
}

/** Convenience for a provider that is not yet configured. */
export function notConfiguredResult(reference: string): ProviderInitResult {
  return {
    message: 'Payment provider not configured. Set its API key in the environment.',
    providerReference: reference,
  };
}
