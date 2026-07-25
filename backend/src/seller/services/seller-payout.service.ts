import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SellerPayout, PayoutStatus } from '../entities/seller-payout.entity';
import { Seller, SellerStatus } from '../entities/seller.entity';
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
  ) {}

  // ==========================================
  // PAYOUT REQUESTS
  // ==========================================

  /**
   * Request a payout
   */
  async requestPayout(
    sellerId: string,
    requestDto: RequestPayoutDto,
  ): Promise<SellerPayout> {
    // Get seller
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, deleted_at: null },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Validate seller can receive payouts
    if (!seller.canReceivePayouts()) {
      throw new BadRequestException(
        'Seller must be active and have payout method configured',
      );
    }

    // Check minimum payout amount (e.g., 1000 NGN)
    const MIN_PAYOUT = 1000;
    if (requestDto.amount < MIN_PAYOUT) {
      throw new BadRequestException(
        `Minimum payout amount is ${MIN_PAYOUT} ${requestDto.currency || 'NGN'}`,
      );
    }

    // Check if seller has sufficient balance
    // TODO: Integrate with actual balance calculation from orders
    // For now, we'll just check against total_sales
    const availableBalance = seller.total_sales; // Simplified
    if (requestDto.amount > availableBalance) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${availableBalance}`,
      );
    }

    // Check for pending payouts (max 1 pending at a time)
    const pendingPayout = await this.payoutRepository.findOne({
      where: {
        seller_id: sellerId,
        status: PayoutStatus.PENDING,
      },
    });

    if (pendingPayout) {
      throw new BadRequestException(
        'You already have a pending payout request',
      );
    }

    // Calculate commission
    const commission_amount = SellerPayout.calculateCommission(
      requestDto.amount,
      seller.commission_rate,
    );
    const net_amount = SellerPayout.calculateNetAmount(
      requestDto.amount,
      seller.commission_rate,
    );

    // Use seller's default payout details or provided ones
    const payout_details = requestDto.payout_details || {
      ...seller.bank_account_details,
      payout_method: seller.payout_method,
    };

    // Create payout
    const payout = this.payoutRepository.create({
      seller_id: sellerId,
      gross_amount: requestDto.amount,
      commission_amount,
      net_amount,
      currency: requestDto.currency || seller.currency,
      commission_rate: seller.commission_rate,
      status: PayoutStatus.PENDING,
      payout_method: seller.payout_method,
      payout_details,
      reference_number: SellerPayout.generateReferenceNumber(),
    });

    return this.payoutRepository.save(payout);
  }

  /**
   * Find all payouts with filtering
   */
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

    return this.payoutRepository.save(payout);
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

    return this.payoutRepository.save(payout);
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
    const payouts = await this.payoutRepository.find({
      where: { seller_id: sellerId },
    });

    const total_payouts = payouts.length;
    const completed = payouts.filter((p) => p.status === PayoutStatus.COMPLETED);
    const pending = payouts.filter((p) => p.status === PayoutStatus.PENDING);
    const failed = payouts.filter((p) => p.status === PayoutStatus.FAILED);

    const total_amount = payouts.reduce((sum, p) => sum + p.net_amount, 0);
    const pending_amount = pending.reduce((sum, p) => sum + p.net_amount, 0);
    const completed_amount = completed.reduce((sum, p) => sum + p.net_amount, 0);
    const failed_count = failed.length;
    const average_payout = total_payouts > 0 ? total_amount / total_payouts : 0;

    const last_payout_date =
      completed.length > 0
        ? completed.sort(
            (a, b) => b.completed_at.getTime() - a.completed_at.getTime(),
          )[0].completed_at
        : null;

    return {
      total_payouts,
      total_amount,
      pending_amount,
      completed_amount,
      failed_count,
      average_payout,
      last_payout_date,
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
