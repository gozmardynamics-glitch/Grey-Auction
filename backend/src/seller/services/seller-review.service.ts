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

    // Create review
    const review = this.reviewRepository.create({
      seller_id: sellerId,
      bidder_id: bidderId,
      ...createDto,
      status: ReviewStatus.ACTIVE,
      is_verified_purchase: true, // TODO: Verify from orders
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update seller rating
    await this.updateSellerRating(sellerId);

    return savedReview;
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
   * Flag review as inappropriate (admin)
   */
  async flag(
    id: string,
    flagDto: FlagReviewDto,
    adminId: string,
  ): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.FLAGGED;
    review.flag_reason = flagDto.flag_reason;
    review.flagged_by_id = adminId;
    review.flagged_at = new Date();

    return this.reviewRepository.save(review);
  }

  /**
   * Hide review (admin)
   */
  async hide(id: string, adminId: string): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.HIDDEN;
    review.flagged_by_id = adminId;
    review.flagged_at = new Date();

    return this.reviewRepository.save(review);
  }

  /**
   * Restore hidden/flagged review (admin)
   */
  async restore(id: string): Promise<SellerReview> {
    const review = await this.findById(id);

    review.status = ReviewStatus.ACTIVE;
    review.flag_reason = null;
    review.flagged_by_id = null;
    review.flagged_at = null;

    return this.reviewRepository.save(review);
  }

  /**
   * Remove review (admin)
   */
  async remove(id: string, adminId: string): Promise<void> {
    const review = await this.findById(id);

    review.status = ReviewStatus.REMOVED;
    review.deleted_at = new Date();
    review.flagged_by_id = adminId;

    await this.reviewRepository.save(review);

    // Update seller rating after removal
    await this.updateSellerRating(review.seller_id);
  }

  // ==========================================
  // HELPFULNESS
  // ==========================================

  /**
   * Mark review as helpful
   */
  async markHelpful(id: string): Promise<SellerReview> {
    const review = await this.findById(id);
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
    const reviews = await this.reviewRepository.find({
      where: {
        seller_id: sellerId,
        status: ReviewStatus.ACTIVE,
        deleted_at: null,
      },
    });

    const breakdown: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
    });

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
    const reviews = await this.reviewRepository.find({
      where: {
        seller_id: sellerId,
        status: ReviewStatus.ACTIVE,
        deleted_at: null,
      },
    });

    const total_reviews = reviews.length;
    const average_rating = await this.calculateAverageRating(sellerId);
    const rating_breakdown = await this.getRatingBreakdown(sellerId);

    const positive_reviews = reviews.filter((r) => r.isPositive()).length;
    const negative_reviews = reviews.filter((r) => r.isNegative()).length;
    const reviews_with_response = reviews.filter((r) => r.has_response).length;
    const response_rate =
      total_reviews > 0 ? (reviews_with_response / total_reviews) * 100 : 0;

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
