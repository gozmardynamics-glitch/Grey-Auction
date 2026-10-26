import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
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
  /** ISO-4217 charge currency. Defaults to NGN; invoice payments use the
   *  currency the invoice was issued in. */
  currency?: string;
  invoiceId?: string;
  email?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentOrchestrationService {
  private readonly logger = new Logger(PaymentOrchestrationService.name);

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
    let currency = (command.currency || 'NGN').toUpperCase();
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
      // Charge in the currency the invoice was issued in, so the gateway's
      // amount always matches the figure the invoice expects at settlement.
      currency = invoice.currency || currency;
    }

    // The reference is always server-generated. It used to honour a
    // client-supplied `metadata.reference`, and the webhook resolves a payment by
    // reference alone — so a caller could pass someone else's reference and be
    // handed their payment row.
    const reference =
      'PAY-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).slice(2, 7).toUpperCase();

    // One live payment per invoice. Without this a double-click (or a retry after
    // a slow redirect) opens two gateway checkouts, both capture, and only one
    // can settle — the second charge has no refund path.
    if (command.invoiceId) {
      const live = await this.paymentService.findLiveForInvoice(command.invoiceId);
      if (live) {
        this.logger.warn(
          `Reusing in-flight payment ${live.reference} for invoice ${command.invoiceId}`,
        );
        // Shape matches the normal success return so callers need no special case.
        return {
          payment: live,
          checkoutUrl: null,
          paymentInstruction: null,
          message: 'A payment for this invoice is already in progress',
          reused: true,
        };
      }
    }

    const payment = await this.paymentService.create({
      userId: command.userId,
      invoiceId: command.invoiceId ?? null,
      type: command.type,
      provider: command.provider,
      reference,
      amount,
      currency,
      metadata: command.metadata || {},
    });

    const adapter = createProviderAdapter(command.provider);
    const result = await adapter.initialize({
      reference,
      // Server-authoritative amount: when an invoice is being paid, the
      // invoice total wins over any client-supplied amount, otherwise the
      // gateway captures one figure while the invoice expects another and
      // settlement silently never happens.
      amount,
      currency,
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
      // Defense-in-depth: the provider-confirmed amount (adapters normalize it
      // to major units) must match the app payment. On mismatch, refuse to
      // settle and leave the payment PENDING for manual review.
      if (hook.amount !== undefined && Math.abs(Number(hook.amount) - Number(payment.amount)) > 0.01) {
        this.logger.warn(
          `Webhook amount mismatch for ${payment.reference}: provider=${hook.amount} app=${payment.amount} — not settling`,
        );
        return { success: false, message: 'Amount mismatch — payment left pending for review' };
      }
      return {
        success: true,
        payment: await this.applySucceeded(payment, hook.providerReference ?? payment.providerReference),
      };
    }

    if (hook.status === PaymentStatus.FAILED) {
      // Out-of-order webhook: the provider sometimes reports a failure after
      // the success event has already settled (network retries). The payment
      // is terminal at SUCCEEDED — acknowledge so the provider stops
      // retrying, but do not touch the state.
      if (payment.status === PaymentStatus.SUCCEEDED) {
        this.logger.warn(
          `Late failure webhook for settled payment ${payment.reference} — ignored, settlement stands`,
        );
        return { success: true, payment, message: 'Payment already settled — failure report ignored' };
      }
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
      // Same server-side amount authority as the webhook path.
      if (result.amount !== undefined && Math.abs(Number(result.amount) - Number(payment.amount)) > 0.01) {
        this.logger.warn(
          `Reconciliation amount mismatch for ${payment.reference}: provider=${result.amount} app=${payment.amount} — not settling`,
        );
        return payment;
      }
      return this.applySucceeded(payment, result.providerReference ?? payment.providerReference);
    }

    if (result.status === PaymentStatus.FAILED) {
      // The app says settled but the provider says failed: that is an
      // inconsistency for a human, not an automatic transition. Surface it
      // and leave the payment exactly as it is.
      if (payment.status === PaymentStatus.SUCCEEDED) {
        this.logger.warn(
          `INCONSISTENCY: provider reports FAILED for settled payment ${payment.reference} — keeping SUCCEEDED, needs manual review`,
        );
        return payment;
      }
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
