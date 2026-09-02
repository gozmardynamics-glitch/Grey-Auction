import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Seller,
  SellerVerificationStatus,
  SellerStatus,
} from '../entities/seller.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import { Invoice } from '../../invoices/invoice.entity';
import {
  RegisterSellerDto,
  UpdateSellerDto,
  ApproveSellerDto,
  RejectSellerDto,
  SuspendSellerDto,
  UpdateCommissionRateDto,
  SellerQueryDto,
} from '../dto';

/**
 * Service for managing sellers
 */
@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  // ==========================================
  // SELLER SHOP (listings / sales)
  // ==========================================

  /** Products listed by the authenticated seller (their user id). */
  async getMyListings(userId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { sellerId: userId },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Sales: sold products + invoices + revenue totals. */
  async getMySales(userId: string) {
    const products = await this.productRepo.find({
      where: { sellerId: userId, status: ProductStatus.SOLD },
      order: { createdAt: 'DESC' },
    });
    const invoices = await this.invoiceRepo.find({
      where: { seller_id: userId },
      order: { issued_at: 'DESC' },
    });
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0),
      0,
    );
    return {
      products,
      invoices,
      totalRevenue,
      totalSales: products.length,
    };
  }

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  /**
   * Register a new seller
   */
  async register(
    userId: string,
    registerDto: RegisterSellerDto,
  ): Promise<Seller> {
    // Check if user already has a seller account
    const existingSeller = await this.sellerRepository.findOne({
      where: { user_id: userId },
    });

    if (existingSeller) {
      throw new ConflictException('User already has a seller account');
    }

    // Check if email is already used
    const existingEmail = await this.sellerRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    // Create seller
    const seller = this.sellerRepository.create({
      user_id: userId,
      ...registerDto,
      verification_status: SellerVerificationStatus.PENDING,
      status: SellerStatus.INACTIVE, // Inactive until verified
      commission_rate: 10.0, // Default 10%
      currency: 'NGN',
    });

    return this.sellerRepository.save(seller);
  }

  /**
   * Find all sellers with filtering and pagination
   */
  async findAll(query: SellerQueryDto): Promise<{
    data: Seller[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      verification_status,
      status,
      business_type,
      country,
      city,
      search,
      min_rating,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = query;

    const queryBuilder = this.sellerRepository
      .createQueryBuilder('seller')
      .where('seller.deleted_at IS NULL');

    // Apply filters
    if (verification_status) {
      queryBuilder.andWhere('seller.verification_status = :verification_status', {
        verification_status,
      });
    }

    if (status) {
      queryBuilder.andWhere('seller.status = :status', { status });
    }

    if (business_type) {
      queryBuilder.andWhere('seller.business_type = :business_type', {
        business_type,
      });
    }

    if (country) {
      queryBuilder.andWhere('seller.country = :country', { country });
    }

    if (city) {
      queryBuilder.andWhere('seller.city ILIKE :city', { city: `%${city}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(seller.business_name ILIKE :search OR seller.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (min_rating) {
      queryBuilder.andWhere('seller.rating >= :min_rating', { min_rating });
    }

    // Apply sorting
    queryBuilder.orderBy(`seller.${sort_by}`, sort_order);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find seller by ID
   */
  async findById(id: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { id, deleted_at: null },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  /**
   * Find seller by user ID
   */
  async findByUserId(userId: string): Promise<Seller | null> {
    return this.sellerRepository.findOne({
      where: { user_id: userId, deleted_at: null },
    });
  }

  /**
   * Find seller by email
   */
  async findByEmail(email: string): Promise<Seller | null> {
    return this.sellerRepository.findOne({
      where: { email, deleted_at: null },
    });
  }

  /**
   * Update seller profile
   */
  async update(id: string, updateDto: UpdateSellerDto): Promise<Seller> {
    const seller = await this.findById(id);

    // Check email uniqueness if changing
    if (updateDto.email && updateDto.email !== seller.email) {
      const existingEmail = await this.findByEmail(updateDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update fields
    Object.assign(seller, updateDto);

    return this.sellerRepository.save(seller);
  }

  /**
   * Soft delete seller
   */
  async remove(id: string): Promise<void> {
    const seller = await this.findById(id);

    seller.deleted_at = new Date();
    seller.status = SellerStatus.INACTIVE;

    await this.sellerRepository.save(seller);
  }

  // ==========================================
  // VERIFICATION OPERATIONS (ADMIN)
  // ==========================================

  /**
   * Approve seller
   */
  async approve(
    id: string,
    approveDto: ApproveSellerDto,
    adminId: string,
  ): Promise<Seller> {
    const seller = await this.findById(id);

    // Check current status
    if (seller.verification_status === SellerVerificationStatus.APPROVED) {
      throw new BadRequestException('Seller is already approved');
    }

    // Update verification
    seller.verification_status = SellerVerificationStatus.APPROVED;
    seller.verification_notes = approveDto.verification_notes;
    seller.verified_at = new Date();
    seller.verified_by_id = adminId;
    seller.status = SellerStatus.ACTIVE;

    // Update commission rate if provided
    if (approveDto.commission_rate) {
      seller.commission_rate = approveDto.commission_rate;
    }

    return this.sellerRepository.save(seller);
  }

  /**
   * Reject seller
   */
  async reject(
    id: string,
    rejectDto: RejectSellerDto,
    adminId: string,
  ): Promise<Seller> {
    const seller = await this.findById(id);

    seller.verification_status = SellerVerificationStatus.REJECTED;
    seller.verification_notes = rejectDto.verification_notes;
    seller.rejection_reason = rejectDto.rejection_reason;
    seller.rejected_at = new Date();
    seller.verified_by_id = adminId;

    return this.sellerRepository.save(seller);
  }

  /**
   * Suspend seller
   */
  async suspend(
    id: string,
    suspendDto: SuspendSellerDto,
    adminId: string,
  ): Promise<Seller> {
    const seller = await this.findById(id);

    seller.status = SellerStatus.SUSPENDED;
    seller.suspension_reason = suspendDto.suspension_reason;
    seller.suspended_at = new Date();
    seller.suspended_by_id = adminId;

    // Add to internal notes
    if (suspendDto.internal_notes) {
      const note = `[${new Date().toISOString()}] SUSPENDED: ${suspendDto.internal_notes}`;
      seller.internal_notes = seller.internal_notes
        ? `${seller.internal_notes}\n\n${note}`
        : note;
    }

    return this.sellerRepository.save(seller);
  }

  /**
   * Activate seller
   */
  async activate(id: string, adminId?: string): Promise<Seller> {
    const seller = await this.findById(id);

    // Only activate if verified
    if (seller.verification_status !== SellerVerificationStatus.APPROVED) {
      throw new BadRequestException('Seller must be verified before activation');
    }

    seller.status = SellerStatus.ACTIVE;
    seller.suspension_reason = null;
    seller.suspended_at = null;
    seller.suspended_by_id = null;

    if (adminId) {
      const note = `[${new Date().toISOString()}] ACTIVATED by admin: ${adminId}`;
      seller.internal_notes = seller.internal_notes
        ? `${seller.internal_notes}\n\n${note}`
        : note;
    }

    return this.sellerRepository.save(seller);
  }

  /**
   * Update commission rate
   */
  async updateCommissionRate(
    id: string,
    updateDto: UpdateCommissionRateDto,
    adminId: string,
  ): Promise<Seller> {
    const seller = await this.findById(id);

    const oldRate = seller.commission_rate;
    seller.commission_rate = updateDto.commission_rate;

    // Add to internal notes
    const note = `[${new Date().toISOString()}] Commission rate changed from ${oldRate}% to ${updateDto.commission_rate}% by admin: ${adminId}. Reason: ${updateDto.reason || 'N/A'}`;
    seller.internal_notes = seller.internal_notes
      ? `${seller.internal_notes}\n\n${note}`
      : note;

    return this.sellerRepository.save(seller);
  }

  /**
   * U5 answer #3 — set the seller's payout schedule preference.
   * instant | daily | weekly | monthly (no fixed T+N holding period).
   */
  async setPayoutFrequency(id: string, frequency: string): Promise<Seller> {
    const ALLOWED = ['instant', 'daily', 'weekly', 'monthly'];
    if (!ALLOWED.includes(frequency)) {
      throw new BadRequestException(
        'payout frequency must be one of: ' + ALLOWED.join(', '),
      );
    }
    const seller = await this.findById(id);
    seller.payout_frequency = frequency;
    return this.sellerRepository.save(seller);
  }

  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================

  /**
   * Get seller statistics
   */
  async getStatistics(id: string): Promise<{
    total_sales: number;
    total_products: number;
    active_products: number;
    total_orders: number;
    completed_orders: number;
    rating: number;
    total_reviews: number;
    completion_rate: number;
  }> {
    const seller = await this.findById(id);

    return {
      total_sales: seller.total_sales,
      total_products: seller.total_products,
      active_products: seller.active_products,
      total_orders: seller.total_orders,
      completed_orders: seller.completed_orders,
      rating: seller.rating,
      total_reviews: seller.total_reviews,
      completion_rate: seller.completion_rate,
    };
  }

  /**
   * Update seller metrics
   */
  async updateMetrics(
    id: string,
    data: {
      sales_increment?: number;
      products_increment?: number;
      active_products_delta?: number;
      orders_increment?: number;
      completed_orders_increment?: number;
    },
  ): Promise<Seller> {
    const seller = await this.findById(id);
    seller.updateMetrics(data);
    return this.sellerRepository.save(seller);
  }

  /**
   * Update seller rating
   */
  async updateRating(id: string, newRating: number): Promise<Seller> {
    const seller = await this.findById(id);
    seller.updateRating(newRating);
    return this.sellerRepository.save(seller);
  }

  // ==========================================
  // DASHBOARD DATA
  // ==========================================

  /**
   * Get seller dashboard data
   */
  async getDashboard(id: string): Promise<{
    seller: Seller;
    stats: any;
    recent_activity: any;
  }> {
    const seller = await this.findById(id);
    const stats = await this.getStatistics(id);
    const recent_activity = await this.getRecentActivity(seller.user_id);

    return {
      seller,
      stats,
      recent_activity,
    };
  }

  /** Most recent seller activity, derived from real invoices + product listings. */
  async getRecentActivity(sellerUserId: string) {
    const [invoices, products] = await Promise.all([
      this.invoiceRepo.find({
        where: { seller_id: sellerUserId },
        order: { created_at: 'DESC' },
        take: 8,
      }),
      this.productRepo.find({
        where: { sellerId: sellerUserId },
        order: { createdAt: 'DESC' },
        take: 8,
      }),
    ]);

    const activity: Array<{
      id: string;
      type: 'invoice' | 'product';
      title: string;
      description: string;
      createdAt: Date;
      link: string;
    }> = [];

    for (const inv of invoices) {
      activity.push({
        id: 'invoice-' + inv.id,
        type: 'invoice',
        title: 'Invoice ' + inv.invoice_number,
        description:
          'Sold for ' + Number(inv.hammer_price).toLocaleString('en-NG') + ' NGN (' + inv.status + ')',
        createdAt: inv.created_at,
        link: '/seller/sales',
      });
    }

    for (const product of products) {
      activity.push({
        id: 'product-' + product.id,
        type: 'product',
        title: product.title,
        description: 'Listing ' + product.status,
        createdAt: product.createdAt,
        link: '/auctions/' + (product.slug ?? product.id),
      });
    }

    activity.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return activity.slice(0, 12);
  }

  // ==========================================
  // ADMIN STATISTICS
  // ==========================================

  /**
   * Get platform-wide seller statistics (admin)
   */
  async getPlatformStatistics(): Promise<{
    total_sellers: number;
    active_sellers: number;
    pending_verification: number;
    suspended_sellers: number;
    total_sales: number;
    average_rating: number;
  }> {
    const [
      total_sellers,
      active_sellers,
      pending_verification,
      suspended_sellers,
    ] = await Promise.all([
      this.sellerRepository.count({ where: { deleted_at: null } }),
      this.sellerRepository.count({
        where: { status: SellerStatus.ACTIVE, deleted_at: null },
      }),
      this.sellerRepository.count({
        where: {
          verification_status: SellerVerificationStatus.PENDING,
          deleted_at: null,
        },
      }),
      this.sellerRepository.count({
        where: { status: SellerStatus.SUSPENDED, deleted_at: null },
      }),
    ]);

    // Calculate total sales and average rating
    const result = await this.sellerRepository
      .createQueryBuilder('seller')
      .select('SUM(seller.total_sales)', 'total_sales')
      .addSelect('AVG(seller.rating)', 'average_rating')
      .where('seller.deleted_at IS NULL')
      .getRawOne();

    return {
      total_sellers,
      active_sellers,
      pending_verification,
      suspended_sellers,
      total_sales: parseFloat(result.total_sales) || 0,
      average_rating: parseFloat(result.average_rating) || 0,
    };
  }
}
