import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerReview, ReviewStatus } from '../entities/seller-review.entity';
import { Seller } from '../entities/seller.entity';
import { Invoice } from '../../invoices/invoice.entity';
import {
  CreateReviewDto,
  RespondToReviewDto,
  FlagReviewDto,
  ReviewQueryDto,
} from '../dto';

/**
 * Service for managing seller reviews and ratings
 */
@Injectable()
export class SellerReviewService {
  constructor(
    @InjectRepository(SellerReview)
    private readonly reviewRepository: Repository<SellerReview>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  // ==========================================
  // REVIEW CREATION
  // ==========================================

  /**
   * Create a new review
   */
  async create(
    sellerId: string,
    bidderId: string,
    createDto: CreateReviewDto,
  ): Promise<SellerReview> {
    // Verify seller exists
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, deleted_at: null },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Self-review block: the seller's own user account may never review (or
    // vote on) their own profile.
    if (seller.user_id === bidderId) {
      throw new ForbiddenException('You cannot review your own seller profile');
    }

    // Check if bidder already reviewed this seller for this auction/product
    if (createDto.auction_id || createDto.product_id) {
      const existing = await this.reviewRepository.findOne({
        where: {
          seller_id: sellerId,
          bidder_id: bidderId,
          auction_id: createDto.auction_id,
          product_id: createDto.product_id,
          deleted_at: null,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'You have already reviewed this seller for this purchase',
        );
      }
    }

    // Validate rating
    if (createDto.rating < 1 || createDto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // A purchase is "verified" only if a won invoice exists for this buyer+auction.
    const isVerifiedPurchase = await this.isVerifiedPurchase(
      sellerId,
      bidderId,
      createDto,
    );

    // Create review
    const review = this.reviewRepository.create({
      seller_id: sellerId,
      bidder_id: bidderId,
      ...createDto,
      status: ReviewStatus.ACTIVE,
      is_verified_purchase: isVerifiedPurchase,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update seller rating
    await this.updateSellerRating(sellerId);

    return savedReview;
  }

  /** True if the bidder has a won (invoiced) auction from this seller. */
  private async isVerifiedPurchase(
    sellerId: string,
    bidderId: string,
    dto: CreateReviewDto,
  ): Promise<boolean> {
    const where: Record<string, unknown> = {
      seller_id: sellerId,
      buyer_id: bidderId,
    };
    if (dto.auction_id) where.auction_id = dto.auction_id;
    if (dto.product_id) where.product_id = dto.product_id;
    const invoice = await this.invoiceRepository.findOne({ where });
    return !!invoice;
  }

  /**
   * Find all reviews with filtering
   */
  async findAll(query: ReviewQueryDto): Promise<{
    data: SellerReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, rating, seller_id, bidder_id } = query;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.seller', 'seller')
      .where('review.deleted_at IS NULL')
      .andWhere('review.status = :status', { status: ReviewStatus.ACTIVE });

    // Apply filters
    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (seller_id) {
      queryBuilder.andWhere('review.seller_id = :seller_id', { seller_id });
    }

    if (bidder_id) {
      queryBuilder.andWhere('review.bidder_id = :bidder_id', { bidder_id });
    }

    // Sort by most recent first
    queryBuilder.orderBy('review.created_at', 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Find review by ID
   */
  async findById(id: string): Promise<SellerReview> {
    const review = await this.reviewRepository.findOne({
      where: { id, deleted_at: null },
      relations: ['seller'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Get all reviews for a seller
   */
  async getSellerReviews(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: SellerReview[];
    total: number;
    page: number;
    limit: number;
    average_rating: number;
    rating_breakdown: { [key: number]: number };
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: {
        seller_id: sellerId,
        status: ReviewStatus.ACTIVE,
        deleted_at: null,
      },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate average rating
    const average_rating = await this.calculateAverageRating(sellerId);

    // Calculate rating breakdown
    const rating_breakdown = await this.getRatingBreakdown(sellerId);

    return {
      data,
      total,
      page,
      limit,
      average_rating,
      rating_breakdown,
    };
  }

  // ==========================================
  // SELLER RESPONSE
  // ==========================================

  /**
   * Seller responds to a review
   */
  async respond(
    id: string,
    sellerId: string,
    respondDto: RespondToReviewDto,
  ): Promise<SellerReview> {
    const review = await this.findById(id);

    // Verify ownership
    if (review.seller_id !== sellerId) {
      throw new ForbiddenException('You can only respond to your own reviews');
    }

    // Check if already responded
    if (review.has_response) {
      throw new BadRequestException('You have already responded to this review');
    }

    review.addResponse(respondDto.response);

    return this.reviewRepository.save(review);
  }

  // ==========================================
  // REVIEW MODERATION (ADMIN)
  // ==========================================

  /**
   * Flag a review for moderation attention (admin).
   *
   * This records the reason and puts the review at the front of the queue; it
   * deliberately does NOT change `status`. Suppressing a review is a decision
   * (`hide`/`remove`) and has to be made as one, so that "we are looking at it"
   * never looks like "we have taken it down".
   */
  async flag(
    id: string,
    flagDto: FlagReviewDto,
    adminId: string,
  ): Promise<SellerReview> {
    const review = await this.findById(id);

    review.flag_reason = flagDto.flag_reason;
    review.flagged_by_id = adminId;
    review.flagged_at = new Date();
    review.report_resolved_at = null;
    review.report_resolution = null;

    return this.reviewRepository.save(review);
  }

  /**
   * Record a user's report against a review without changing its visibility.
   *
   * Three rules make this fair to everybody involved:
   *   - a report never hides anything, so reporting cannot be used to scrub a
   *     rating you disagree with;
   *   - one report per person per review, so a single aggrieved user cannot
   *     inflate the signal by repeating;
   *   - nobody may report their own review, or a review about their own
   *     business. A seller who believes a review is untrue replies to it
   *     publicly or complains; they do not get to quietly delete it.
   */
  async report(id: string, reason: string, reporterId: string): Promise<SellerReview> {
    const review = await this.findById(id);

    if (review.status === ReviewStatus.REMOVED) {
      throw new BadRequestException('This review has been removed and cannot be reported');
    }
    if (review.bidder_id === reporterId) {
      throw new BadRequestException('You cannot report your own review');
    }

    const sellerUserId = review.seller?.user_id
      ?? (await this.sellerRepository.findOne({ where: { id: review.seller_id } }))?.user_id;
    if (sellerUserId && sellerUserId === reporterId) {
      throw new ForbiddenException(
        'A seller cannot report a review about their own business. Reply to the review, or raise a complaint if you believe it is false.',
      );
    }

    const reporters = Array.isArray(review.reporters) ? review.reporters : [];
    if (reporters.includes(reporterId)) {
      // Already counted: answering with the same review keeps a retry harmless
      // instead of inflating report_count.
      return review;
    }

    // A review that was reported, decided, and is now reported again starts a
    // fresh clock; reporters stay on the record so nobody reports twice.
    const startingACycle = !review.flagged_at || !!review.report_resolved_at;
    review.reporters = [...reporters, reporterId];
    review.report_count = (review.report_count ?? 0) + 1;
    review.flag_reason = reason;
    review.flagged_by_id = reporterId;
    review.flagged_at = startingACycle ? new Date() : review.flagged_at;
    review.report_resolved_at = null;
    review.report_resolution = null;

    return this.reviewRepository.save(review);
  }

  /**
   * Reviews with an outstanding report, most-reported first — several
   * independent complaints are a stronger signal than one, and the queue should
   * reflect that instead of the raw clock.
   */
  async reported(limit = 200): Promise<SellerReview[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .where('review.flag_reason IS NOT NULL')
      .andWhere('review.status <> :removed', { removed: ReviewStatus.REMOVED })
      .orderBy('review.report_count', 'DESC')
      .addOrderBy('review.flagged_at', 'ASC')
      .take(limit)
      .getMany();
  }

  /**
   * Hide review (admin) — a decision, so the outstanding report is answered.
   */
  async hide(id: string, adminId: string): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.HIDDEN;
    review.flagged_by_id = adminId;
    review.flagged_at = new Date();
    review.flag_reason = null;
    review.report_resolved_at = new Date();
    review.report_resolution = 'upheld';

    const saved = await this.reviewRepository.save(review);
    // A hidden review leaves the average, so the cached rating has to move with
    // it — otherwise the profile shows a rating the review list contradicts.
    await this.updateSellerRating(review.seller_id);
    return saved;
  }

  /**
   * Restore a hidden review (admin) — the report was not upheld.
   */
  async restore(id: string): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.ACTIVE;
    review.flagged_by_id = null;
    review.flagged_at = null;
    review.flag_reason = null;
    review.report_resolved_at = new Date();
    review.report_resolution = 'rejected';

    const saved = await this.reviewRepository.save(review);
    await this.updateSellerRating(review.seller_id);
    return saved;
  }

  /**
   * Remove review (admin)
   */
  async remove(id: string, adminId: string): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.REMOVED;
    review.deleted_at = new Date();
    review.flagged_by_id = adminId;
    review.flag_reason = null;
    review.report_resolved_at = new Date();
    review.report_resolution = 'upheld';

    const saved = await this.reviewRepository.save(review);

    // Update seller rating after removal
    await this.updateSellerRating(review.seller_id);

    return saved;
  }

  /**
   * Decide a reported review in one place, so every route that moderates a
   * review changes status, answers the report and refreshes the seller's cached
   * rating the same way.
   */
  async decide(
    id: string,
    action: 'hide' | 'remove' | 'restore',
    adminId: string,
  ): Promise<SellerReview> {
    if (action === 'hide') return this.hide(id, adminId);
    if (action === 'remove') return this.remove(id, adminId);
    if (action === 'restore') return this.restore(id);
    throw new BadRequestException('action must be hide, remove or restore');
  }

  // ==========================================
  // HELPFULNESS
  // ==========================================

  /**
   * Mark review as helpful.
   *
   * `userId` (when supplied) is refused a vote on the reviewed seller's own
   * profile — the seller pumping their own helpful_count. Route-level auth +
   * throttle bound anonymous abuse.
   */
  async markHelpful(id: string, userId?: string): Promise<SellerReview> {
    const review = await this.findById(id);
    if (userId) {
      const seller = await this.sellerRepository.findOne({
        where: { id: review.seller_id },
        select: ['id', 'user_id'],
      });
      if (seller && seller.user_id === userId) {
        throw new ForbiddenException('You cannot vote on reviews of your own seller profile');
      }
    }
    review.markHelpful();
    return this.reviewRepository.save(review);
  }

  /**
   * Mark review as not helpful
   */
  async markNotHelpful(id: string): Promise<SellerReview> {
    const review = await this.findById(id);
    review.markNotHelpful();
    return this.reviewRepository.save(review);
  }

  // ==========================================
  // RATING CALCULATIONS
  // ==========================================

  /**
   * Calculate average rating for seller
   */
  async calculateAverageRating(sellerId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.seller_id = :sellerId', { sellerId })
      .andWhere('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.deleted_at IS NULL')
      .getRawOne();

    return parseFloat(result.average) || 0;
  }

  /**
   * Get rating breakdown (count per star rating)
   */
  async getRatingBreakdown(
    sellerId: string,
  ): Promise<{ [key: number]: number }> {
    const raw = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.seller_id = :sellerId', { sellerId })
      .andWhere('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.deleted_at IS NULL')
      .groupBy('review.rating')
      .getRawMany();

    const breakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of raw) {
      breakdown[row.rating] = parseInt(row.count, 10) || 0;
    }
    return breakdown;
  }

  /**
   * Update seller's cached rating
   */
  private async updateSellerRating(sellerId: string): Promise<void> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
    });

    if (!seller) return;

    const average = await this.calculateAverageRating(sellerId);
    const count = await this.reviewRepository.count({
      where: {
        seller_id: sellerId,
        status: ReviewStatus.ACTIVE,
        deleted_at: null,
      },
    });

    seller.rating = average;
    seller.total_reviews = count;

    await this.sellerRepository.save(seller);
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get review statistics for seller
   */
  async getSellerStatistics(sellerId: string): Promise<{
    total_reviews: number;
    average_rating: number;
    rating_breakdown: { [key: number]: number };
    positive_reviews: number;
    negative_reviews: number;
    reviews_with_response: number;
    response_rate: number;
  }> {
    const raw = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'total_reviews')
      .addSelect('AVG(review.rating)', 'average_rating')
      .addSelect(
        'SUM(CASE WHEN review.rating >= 4 THEN 1 ELSE 0 END)',
        'positive_reviews',
      )
      .addSelect(
        'SUM(CASE WHEN review.rating <= 2 THEN 1 ELSE 0 END)',
        'negative_reviews',
      )
      .addSelect(
        'SUM(CASE WHEN review.response IS NOT NULL THEN 1 ELSE 0 END)',
        'reviews_with_response',
      )
      .where('review.seller_id = :sellerId', { sellerId })
      .andWhere('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.deleted_at IS NULL')
      .getRawOne();

    const total_reviews = parseInt(raw.total_reviews, 10) || 0;
    const average_rating = parseFloat(raw.average_rating) || 0;
    const positive_reviews = parseInt(raw.positive_reviews, 10) || 0;
    const negative_reviews = parseInt(raw.negative_reviews, 10) || 0;
    const reviews_with_response = parseInt(raw.reviews_with_response, 10) || 0;
    const response_rate = total_reviews > 0 ? (reviews_with_response / total_reviews) * 100 : 0;
    const rating_breakdown = await this.getRatingBreakdown(sellerId);

    return {
      total_reviews,
      average_rating,
      rating_breakdown,
      positive_reviews,
      negative_reviews,
      reviews_with_response,
      response_rate,
    };
  }
}
