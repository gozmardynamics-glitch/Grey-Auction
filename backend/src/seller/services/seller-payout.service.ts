import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, In } from 'typeorm';
import { SellerPayout, PayoutStatus } from '../entities/seller-payout.entity';
import { Seller, SellerStatus } from '../entities/seller.entity';
import { Invoice, InvoiceStatus } from '../../invoices/invoice.entity';
import { WalletService } from '../../wallet/wallet.service';
import { WalletTransactionType } from '../../wallet/wallet-transaction.entity';
import {
  RequestPayoutDto,
  ProcessPayoutDto,
  CancelPayoutDto,
  PayoutQueryDto,
} from '../dto';

/**
 * Service for managing seller payouts
 */
@Injectable()
export class SellerPayoutService {
  constructor(
    @InjectRepository(SellerPayout)
    private readonly payoutRepository: Repository<SellerPayout>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
  ) {}

  /** Hours a newly changed payout account must rest before money can leave. */
  private get bankHoldHours(): number {
    const configured = Number(process.env.PAYOUT_BANK_HOLD_HOURS ?? 48);
    return Number.isFinite(configured) && configured >= 0 ? configured : 48;
  }

  // ==========================================
  // PAYOUT REQUESTS
  // ==========================================

  /**
   * Request a payout
   */
  /**
   * Request a payout.
   *
   * Accounting model: the seller's released proceeds already sit in their
   * wallet (escrow release credits `seller_net`). A payout therefore DRAWS DOWN
   * that ledger instead of recomputing a balance from invoice rows, which had
   * two defects — it counted unpaid invoices as available, and it deducted
   * commission a second time on money the invoice had already netted.
   *
   * The amount is debited at request time (a two-phase hold), so an in-flight
   * payout cannot be requested twice, and a failed or cancelled payout is
   * credited back.
   */
  async requestPayout(
    sellerId: string,
    requestDto: RequestPayoutDto,
  ): Promise<SellerPayout> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, deleted_at: null },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    if (!seller.canReceivePayouts()) {
      throw new BadRequestException(
        'Seller must be active and have payout method configured',
      );
    }

    const MIN_PAYOUT = 1000;
    if (requestDto.amount < MIN_PAYOUT) {
      throw new BadRequestException(
        `Minimum payout amount is ${MIN_PAYOUT} ${requestDto.currency || 'NGN'}`,
      );
    }

    // A changed payout account must rest: diverting funds to a freshly edited
    // bank account is the classic payout-fraud path.
    if (seller.bank_changed_at) {
      const restMs = this.bankHoldHours * 60 * 60 * 1000;
      const readyAt = new Date(new Date(seller.bank_changed_at).getTime() + restMs);
      if (Date.now() < readyAt.getTime()) {
        throw new BadRequestException(
          `Your payout account was changed recently. Payouts open again on ${readyAt.toISOString()}.`,
        );
      }
    }

    // The wallet PIN is the account holder's second factor for money leaving.
    const pinOk = await this.walletService.verifyPin(seller.user_id, requestDto.pin ?? '');
    if (!pinOk) {
      throw new BadRequestException('Invalid wallet PIN');
    }

    return this.dataSource.transaction(async (manager) => {
      const payoutRepo = manager.getRepository(SellerPayout);

      const pendingPayout = await payoutRepo.findOne({
        where: {
          seller_id: sellerId,
          status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]),
        },
      });
      if (pendingPayout) {
        throw new BadRequestException('You already have a payout in progress');
      }

      // Read for a helpful message; debitInManager re-checks under the row lock.
      const walletView = await this.walletService.getWallet(seller.user_id);
      const available = Number(walletView?.balance ?? 0);
      if (requestDto.amount > available) {
        throw new BadRequestException(
          'Insufficient available balance. Cleared funds: ' + available,
        );
      }

      const payout_details = requestDto.payout_details || {
        ...seller.bank_account_details,
        payout_method: seller.payout_method,
      };

      const payout = await payoutRepo.save(
        payoutRepo.create({
          seller_id: sellerId,
          // NOT NULL + unique: a payout without a human-quotable reference is
          // useless to finance anyway.
          reference_number:
            'PO-' + Date.now().toString(36).toUpperCase() + '-' +
            Math.random().toString(36).slice(2, 6).toUpperCase(),
          gross_amount: requestDto.amount,
          // Commission was charged on the invoice when it settled; charging it
          // again here took it twice.
          commission_amount: 0,
          net_amount: requestDto.amount,
          currency: (requestDto.currency || seller.currency || 'NGN').toUpperCase(),
          commission_rate: Number(seller.commission_rate) || 0,
          payout_method: String(payout_details?.payout_method ?? seller.payout_method ?? 'BANK_TRANSFER'),
          payout_details,
          processing_notes: requestDto.notes ?? null,
          status: PayoutStatus.PENDING,
        }),
      );

      // Hold the money now: the debit is what makes a second request impossible.
      await this.walletService.debitInManager(manager, seller.user_id, {
        amount: requestDto.amount,
        reference: 'payout_request:' + payout.id,
        description: 'Payout request ' + payout.id.slice(0, 8),
        type: WalletTransactionType.WITHDRAW,
      });

      return payout;
    });
  }

  async findAll(query: PayoutQueryDto): Promise<{
    data: SellerPayout[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      start_date,
      end_date,
      seller_id,
    } = query;

    const queryBuilder = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.seller', 'seller');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('payout.status = :status', { status });
    }

    if (seller_id) {
      queryBuilder.andWhere('payout.seller_id = :seller_id', { seller_id });
    }

    if (start_date && end_date) {
      queryBuilder.andWhere('payout.requested_at BETWEEN :start_date AND :end_date', {
        start_date,
        end_date,
      });
    }

    // Sort by most recent first
    queryBuilder.orderBy('payout.requested_at', 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Find payout by ID
   */
  async findById(id: string): Promise<SellerPayout> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['seller'],
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  /**
   * Get seller's payout history
   */
  async getSellerPayouts(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: SellerPayout[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.payoutRepository.findAndCount({
      where: { seller_id: sellerId },
      order: { requested_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ==========================================
  // PAYOUT PROCESSING (ADMIN)
  // ==========================================

  /**
   * Process payout (admin)
   */

  /**
   * Return a held payout amount to the seller's wallet.
   *
   * The request debits the wallet immediately (two-phase hold), so a payout that
   * fails or is cancelled must credit it back — otherwise the seller's money
   * disappears into a failed transfer. The reference makes the reversal
   * idempotent.
   */
  private async releaseHold(
    manager: import('typeorm').EntityManager,
    payout: SellerPayout,
  ): Promise<void> {
    const seller = await manager.getRepository(Seller).findOne({
      where: { id: payout.seller_id },
    });
    if (!seller) return;
    await this.walletService.creditInManager(manager, seller.user_id, {
      amount: Number(payout.net_amount),
      reference: 'payout_reversal:' + payout.id,
      description:
        'Payout ' + payout.id.slice(0, 8) + ' returned to your balance',
      type: WalletTransactionType.DEPOSIT,
    });
  }

  /** Re-take the hold when a failed payout is retried. */
  private async retakeHold(
    manager: import('typeorm').EntityManager,
    payout: SellerPayout,
  ): Promise<void> {
    const seller = await manager.getRepository(Seller).findOne({
      where: { id: payout.seller_id },
    });
    if (!seller) return;
    await this.walletService.debitInManager(manager, seller.user_id, {
      amount: Number(payout.net_amount),
      reference: 'payout_retry:' + payout.id + ':' + payout.retry_count,
      description: 'Payout ' + payout.id.slice(0, 8) + ' retry hold',
      type: WalletTransactionType.WITHDRAW,
    });
  }

  async process(
    id: string,
    processDto: ProcessPayoutDto,
    adminId: string,
  ): Promise<SellerPayout> {
    const payout = await this.findById(id);

    // Validate current status
    if (
      payout.status !== PayoutStatus.PENDING &&
      payout.status !== PayoutStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Cannot process payout with status: ${payout.status}`,
      );
    }

    // Validate required fields based on status
    if (processDto.status === PayoutStatus.FAILED && !processDto.failure_reason) {
      throw new BadRequestException('Failure reason is required');
    }

    // Update payout
    payout.status = processDto.status;
    payout.transaction_id = processDto.transaction_id;
    payout.processing_notes = processDto.processing_notes;
    payout.failure_reason = processDto.failure_reason;
    payout.processed_by_id = adminId;

    // Set timestamps based on status
    const now = new Date();
    if (processDto.status === PayoutStatus.PROCESSING) {
      payout.processing_started_at = now;
    } else if (processDto.status === PayoutStatus.COMPLETED) {
      payout.completed_at = now;
    } else if (processDto.status === PayoutStatus.FAILED) {
      payout.failed_at = now;
    }

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(SellerPayout).save(payout);
      if (saved.status === PayoutStatus.FAILED) {
        // The transfer failed: put the held money back in the seller's balance.
        await this.releaseHold(manager, saved);
      }
      return saved;
    });
  }

  /**
   * Cancel payout
   */
  async cancel(
    id: string,
    cancelDto: CancelPayoutDto,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<SellerPayout> {
    const payout = await this.findById(id);

    // Sellers can only cancel their own pending payouts
    if (!isAdmin && payout.seller_id !== userId) {
      throw new ForbiddenException('You can only cancel your own payouts');
    }

    // Can only cancel pending or processing payouts
    if (
      payout.status !== PayoutStatus.PENDING &&
      payout.status !== PayoutStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Cannot cancel payout with status: ${payout.status}`,
      );
    }

    payout.status = PayoutStatus.CANCELLED;
    payout.cancelled_at = new Date();
    payout.processing_notes = payout.processing_notes
      ? `${payout.processing_notes}\n\nCancellation reason: ${cancelDto.cancellation_reason}`
      : `Cancellation reason: ${cancelDto.cancellation_reason}`;

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(SellerPayout).save(payout);
      // Cancelling releases the hold: the money is the seller's again.
      await this.releaseHold(manager, saved);
      return saved;
    });
  }

  /**
   * Retry failed payout (admin)
   */
  async retry(id: string, adminId: string): Promise<SellerPayout> {
    const payout = await this.findById(id);

    if (payout.status !== PayoutStatus.FAILED) {
      throw new BadRequestException('Can only retry failed payouts');
    }

    if (!payout.can_retry) {
      throw new BadRequestException('Maximum retry attempts reached');
    }

    payout.status = PayoutStatus.PENDING;
    payout.retry_count += 1;
    payout.failed_at = null;
    payout.failure_reason = null;
    payout.processed_by_id = adminId;

    return this.payoutRepository.save(payout);
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get payout statistics for seller
   */
  async getSellerStatistics(sellerId: string): Promise<{
    total_payouts: number;
    total_amount: number;
    pending_amount: number;
    completed_amount: number;
    failed_count: number;
    average_payout: number;
    last_payout_date: Date | null;
  }> {
    const raw = await this.payoutRepository
      .createQueryBuilder('payout')
      .select('COUNT(payout.id)', 'total_payouts')
      .addSelect('SUM(payout.net_amount)', 'total_amount')
      .addSelect(
        'SUM(CASE WHEN payout.status = :pending THEN payout.net_amount ELSE 0 END)',
        'pending_amount',
      )
      .addSelect(
        'SUM(CASE WHEN payout.status = :completed THEN payout.net_amount ELSE 0 END)',
        'completed_amount',
      )
      .addSelect(
        'SUM(CASE WHEN payout.status = :failed THEN 1 ELSE 0 END)',
        'failed_count',
      )
      .addSelect('AVG(payout.net_amount)', 'average_payout')
      .addSelect('MAX(payout.completed_at)', 'last_payout_date')
      .where('payout.seller_id = :sellerId', { sellerId })
      .setParameters({
        pending: PayoutStatus.PENDING,
        completed: PayoutStatus.COMPLETED,
        failed: PayoutStatus.FAILED,
      })
      .getRawOne();

    return {
      total_payouts: parseInt(raw.total_payouts, 10) || 0,
      total_amount: parseFloat(raw.total_amount) || 0,
      pending_amount: parseFloat(raw.pending_amount) || 0,
      completed_amount: parseFloat(raw.completed_amount) || 0,
      failed_count: parseInt(raw.failed_count, 10) || 0,
      average_payout: parseFloat(raw.average_payout) || 0,
      last_payout_date: raw.last_payout_date || null,
    };
  }

  /**
   * Get platform-wide payout statistics (admin)
   */
  async getPlatformStatistics(): Promise<{
    total_payouts: number;
    pending_payouts: number;
    completed_payouts: number;
    failed_payouts: number;
    total_amount: number;
    pending_amount: number;
    completed_amount: number;
  }> {
    const [
      total_payouts,
      pending_payouts,
      completed_payouts,
      failed_payouts,
    ] = await Promise.all([
      this.payoutRepository.count(),
      this.payoutRepository.count({ where: { status: PayoutStatus.PENDING } }),
      this.payoutRepository.count({ where: { status: PayoutStatus.COMPLETED } }),
      this.payoutRepository.count({ where: { status: PayoutStatus.FAILED } }),
    ]);

    const result = await this.payoutRepository
      .createQueryBuilder('payout')
      .select('SUM(payout.net_amount)', 'total_amount')
      .addSelect(
        'SUM(CASE WHEN payout.status = :pending THEN payout.net_amount ELSE 0 END)',
        'pending_amount',
      )
      .addSelect(
        'SUM(CASE WHEN payout.status = :completed THEN payout.net_amount ELSE 0 END)',
        'completed_amount',
      )
      .setParameters({
        pending: PayoutStatus.PENDING,
        completed: PayoutStatus.COMPLETED,
      })
      .getRawOne();

    return {
      total_payouts,
      pending_payouts,
      completed_payouts,
      failed_payouts,
      total_amount: parseFloat(result.total_amount) || 0,
      pending_amount: parseFloat(result.pending_amount) || 0,
      completed_amount: parseFloat(result.completed_amount) || 0,
    };
  }
}
