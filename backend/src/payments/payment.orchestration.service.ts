import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentService } from './payment.service';
import { InvoiceService } from '../invoices/invoice.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';
import { OrderService } from '../orders/order.service';
import { EscrowService } from '../escrow/escrow.service';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
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
    private readonly orderService: OrderService,
    private readonly escrowService: EscrowService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** Create the app payment record and ask the chosen provider to initialize. */
  async initialize(command: InitPaymentCommand) {
    // Invoice payments are server-authoritative: the buyer may reference an
    // invoice, but the charged amount is ALWAYS the invoice total (fees + VAT
    // included). Without this, an authenticated buyer could initialize a
    // token payment against a large invoice and the success webhook would
    // still mark it paid. The client's amount is ignored for invoice payments.
    let amount = Number(command.amount);
    if (command.type === PaymentType.INVOICE) {
      if (!command.invoiceId) {
        throw new BadRequestException('invoiceId is required for invoice payments');
      }
      const invoice = await this.invoiceService.findById(command.invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.buyer_id !== command.userId) {
        throw new ForbiddenException('This invoice does not belong to you');
      }
      if (invoice.status !== InvoiceStatus.ISSUED) {
        throw new BadRequestException(
          'Invoice is not payable (status: ' + invoice.status + ')',
        );
      }
      amount = Number(invoice.total);
    }

    const reference = command.metadata?.reference
      ? String(command.metadata.reference)
      : 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

    const payment = await this.paymentService.create({
      userId: command.userId,
      invoiceId: command.invoiceId ?? null,
      type: command.type,
      provider: command.provider,
      reference,
      amount,
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

    if (hook.status === PaymentStatus.SUCCEEDED) {
      return {
        success: true,
        payment: await this.applySucceeded(payment, hook.providerReference ?? payment.providerReference),
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
    const result = await adapter.verify(payment.reference, { amount: payment.amount });

    if (result.verified && result.status === PaymentStatus.SUCCEEDED) {
      return this.applySucceeded(payment, result.providerReference ?? payment.providerReference);
    }

    if (result.status === PaymentStatus.FAILED) {
      return this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED);
    }

    return payment;
  }

  /**
   * Apply a succeeded payment exactly once, atomically with the status flip.
   * A pessimistic lock + status re-check makes concurrent webhook replays safe.
   */
  private async applySucceeded(payment: Payment, providerReference?: string | null): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Payment);
      const locked = await repo.findOne({
        where: { id: payment.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Payment not found');
      if (locked.status === PaymentStatus.SUCCEEDED) return locked;

      await this.applyOutcome(manager, locked);

      locked.status = PaymentStatus.SUCCEEDED;
      locked.providerReference = providerReference ?? locked.providerReference;
      return repo.save(locked);
    });
  }

  /** Conditional outcome within the caller's transaction: invoice -> paid; deposit -> wallet credit. */
  private async applyOutcome(manager: EntityManager, payment: Payment): Promise<void> {
    if (payment.type === PaymentType.INVOICE) {
      if (!payment.invoiceId) return;
      await this.invoiceService.markPaidInManager(manager, payment.invoiceId, {
        paymentMethod: payment.provider,
        paymentReference: payment.reference,
      });
      // D3 seam: create/mark the order paid atomically with the invoice + payment.
      await this.orderService.markPaidInManager(manager, payment.invoiceId, payment.reference);
      // U5 answer #4: place the escrow hold atomically with payment success.
      // The auto-release sweep opens it after the invoice's fixed window (0 = immediate).
      const invoice = await manager.getRepository(Invoice).findOne({
        where: { id: payment.invoiceId },
      });
      if (invoice) {
        await this.escrowService.holdInManager(manager, {
          invoiceId: payment.invoiceId,
          amount: Number(invoice.total),
          buyerId: invoice.buyer_id,
          sellerId: invoice.seller_id,
        });
      }
      return;
    }
    if (payment.type === PaymentType.DEPOSIT) {
      await this.walletService.creditInManager(manager, payment.userId, {
        amount: payment.amount,
        reference: payment.reference,
        description: 'Wallet deposit',
        type: WalletTransactionType.DEPOSIT,
      });
    }
  }
}
