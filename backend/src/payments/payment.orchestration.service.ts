import { Injectable } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InvoiceService } from '../invoices/invoice.service';
import { WalletService } from '../wallet/wallet.service';
import { Payment, PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';
import { createProviderAdapter } from './providers/provider.registry';

export interface InitPaymentCommand {
  userId: string;
  type: PaymentType;
  provider: PaymentProvider;
  amount: number;
  invoiceId?: string;
  email?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentOrchestrationService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly walletService: WalletService,
  ) {}

  /** Create the app payment record and ask the chosen provider to initialize. */
  async initialize(command: InitPaymentCommand) {
    const reference = command.metadata?.reference
      ? String(command.metadata.reference)
      : 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

    const payment = await this.paymentService.create({
      userId: command.userId,
      invoiceId: command.invoiceId ?? null,
      type: command.type,
      provider: command.provider,
      reference,
      amount: command.amount,
      metadata: command.metadata || {},
    });

    const adapter = createProviderAdapter(command.provider);
    const result = await adapter.initialize({
      reference,
      amount: command.amount,
      currency: 'NGN',
      email: command.email,
      callbackUrl: command.callbackUrl,
      metadata: command.metadata || {},
    });

    if (result.providerReference) {
      await this.paymentService.updateStatus(payment.id, payment.status, {
        providerReference: result.providerReference,
      });
    }

    return { payment, checkoutUrl: result.checkoutUrl, paymentInstruction: result.paymentInstruction, message: result.message };
  }

  /** Validate signature, find the app payment, apply the conditional outcome once. */
  async handleWebhook(
    provider: PaymentProvider,
    payload: unknown,
    headers: Record<string, string>,
    rawBody?: string,
  ) {
    const adapter = createProviderAdapter(provider);
    const hook = adapter.parseWebhook(payload, headers, rawBody);

    if (!hook.verified) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    const payment = await this.paymentService.findByReference(hook.reference);
    if (!payment) {
      return { success: false, message: 'Unknown payment reference' };
    }

    if (hook.status === PaymentStatus.SUCCEEDED && payment.status !== PaymentStatus.SUCCEEDED) {
      await this.applySucceededOutcome(payment);
      return {
        success: true,
        payment: await this.paymentService.updateStatus(payment.id, PaymentStatus.SUCCEEDED, {
          providerReference: hook.providerReference ?? payment.providerReference,
        }),
      };
    }

    if (hook.status === PaymentStatus.FAILED) {
      return { success: true, payment: await this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED) };
    }

    return { success: true, payment };
  }

  /** Report which providers are configured (env key present) for admin/UI. */
  providersStatus(): Array<{ provider: PaymentProvider; configured: boolean }> {
    return Object.values(PaymentProvider).map((provider) => {
      const adapter = createProviderAdapter(provider);
      return { provider, configured: adapter.configured() };
    });
  }

  /**
   * Reconcile a stale pending payment against the provider. Used by the
   * reconciliation cron for payments that never delivered a webhook.
   */
  async reconcilePayment(payment: Payment): Promise<Payment> {
    const adapter = createProviderAdapter(payment.provider);
    const result = await adapter.verify(payment.reference);

    if (result.verified && result.status === PaymentStatus.SUCCEEDED) {
      if (payment.status !== PaymentStatus.SUCCEEDED) {
        await this.applySucceededOutcome(payment);
      }
      return this.paymentService.updateStatus(payment.id, PaymentStatus.SUCCEEDED, {
        providerReference: result.providerReference ?? payment.providerReference,
      });
    }

    if (result.status === PaymentStatus.FAILED) {
      return this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED);
    }

    return payment;
  }

  /** Conditional outcome: invoice -> mark paid; deposit -> credit wallet. */
  private async applySucceededOutcome(payment: Payment): Promise<void> {
    if (payment.type === PaymentType.INVOICE) {
      if (!payment.invoiceId) return;
      await this.invoiceService.markPaid(payment.invoiceId, {
        paymentMethod: payment.provider,
        paymentReference: payment.reference,
      });
      return;
    }
    if (payment.type === PaymentType.DEPOSIT) {
      await this.walletService.deposit(payment.userId, {
        amount: payment.amount,
        reference: payment.reference,
      });
    }
  }
}
