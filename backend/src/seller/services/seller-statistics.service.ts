import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  SellerStatistics,
  StatisticsPeriod,
} from '../entities/seller-statistics.entity';
import { Seller } from '../entities/seller.entity';
import { Product } from '../../products/entities/product.entity';
import { Invoice, InvoiceStatus } from '../../invoices/invoice.entity';
import { SellerReview } from '../entities/seller-review.entity';

/**
 * Service for managing seller performance statistics
 */
@Injectable()
export class SellerStatisticsService {
  constructor(
    @InjectRepository(SellerStatistics)
    private readonly statisticsRepository: Repository<SellerStatistics>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(SellerReview)
    private readonly reviewRepository: Repository<SellerReview>,
  ) {}

  // ==========================================
  // STATISTICS GENERATION
  // ==========================================

  /**
   * Generate statistics for a seller and period
   */
  async generate(
    sellerId: string,
    periodType: StatisticsPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SellerStatistics> {
    // Verify seller exists
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, deleted_at: null },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if statistics already exist for this period
    const existing = await this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: periodType,
        period_start: periodStart,
      },
    });

    if (existing) {
      // Update existing
      return this.updateStatistics(existing.id);
    }

    // Create new statistics
    const statistics = this.statisticsRepository.create({
      seller_id: sellerId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
    });

    // Derive metrics from real invoices/products/reviews in the period.
    await this.populateMetrics(statistics, seller.user_id, periodStart, periodEnd);
    statistics.calculateMetrics();

    return this.statisticsRepository.save(statistics);
  }

  /**
   * Update existing statistics
   */
  async updateStatistics(id: string): Promise<SellerStatistics> {
    const statistics = await this.statisticsRepository.findOne({
      where: { id },
    });

    if (!statistics) {
      throw new NotFoundException('Statistics not found');
    }

    const seller = await this.sellerRepository.findOne({
      where: { id: statistics.seller_id, deleted_at: null },
    });
    await this.populateMetrics(
      statistics,
      seller?.user_id || statistics.seller_id,
      statistics.period_start,
      statistics.period_end,
    );
    statistics.calculateMetrics();

    return this.statisticsRepository.save(statistics);
  }

  /** Pull real metrics from invoices/products/reviews within a period. */
  private async populateMetrics(
    statistics: SellerStatistics,
    sellerUserId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    const [invoices, products, reviews] = await Promise.all([
      this.invoiceRepository.find({
        where: { seller_id: sellerUserId, created_at: Between(periodStart, periodEnd) },
      }),
      this.productRepository.find({
        where: { sellerId: sellerUserId, createdAt: Between(periodStart, periodEnd) },
      }),
      this.reviewRepository.find({
        where: { seller_id: sellerUserId, created_at: Between(periodStart, periodEnd) },
      }),
    ]);

    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.hammer_price), 0);
    const commissionPaid = invoices.reduce((sum, inv) => sum + Number(inv.commission), 0);
    const completedOrders = invoices.filter((inv) => inv.status === InvoiceStatus.PAID).length;
    const cancelledOrders = invoices.filter((inv) => inv.status === InvoiceStatus.CANCELLED).length;
    const productsSold = new Set(invoices.map((inv) => inv.product_id)).size;
    const uniqueCustomers = new Set(invoices.map((inv) => inv.buyer_id)).size;
    const positiveReviews = reviews.filter((rev) => rev.rating >= 4).length;
    const negativeReviews = reviews.filter((rev) => rev.rating <= 2).length;
    const averageRating = reviews.length
      ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length
      : 0;

    statistics.total_sales = totalSales;
    statistics.gross_revenue = totalSales;
    statistics.commission_paid = commissionPaid;
    statistics.net_revenue = totalSales - commissionPaid;
    statistics.total_orders = invoices.length;
    statistics.completed_orders = completedOrders;
    statistics.cancelled_orders = cancelledOrders;
    statistics.products_listed = products.length;
    statistics.products_sold = productsSold;
    statistics.unique_customers = uniqueCustomers;
    statistics.reviews_received = reviews.length;
    statistics.average_rating = Number(averageRating.toFixed(2));
    statistics.positive_reviews = positiveReviews;
    statistics.negative_reviews = negativeReviews;
  }

  // ==========================================
  // QUERY STATISTICS
  // ==========================================

  /**
   * Get statistics for a specific period
   */
  async findByPeriod(
    sellerId: string,
    periodType: StatisticsPeriod,
    startDate: Date,
    endDate: Date,
  ): Promise<SellerStatistics[]> {
    return this.statisticsRepository.find({
      where: {
        seller_id: sellerId,
        period_type: periodType,
        period_start: Between(startDate, endDate),
      },
      order: { period_start: 'DESC' },
    });
  }

  /**
   * Get daily statistics
   */
  async getDaily(
    sellerId: string,
    date: Date,
  ): Promise<SellerStatistics | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: StatisticsPeriod.DAILY,
        period_start: startOfDay,
      },
    });
  }

  /**
   * Get weekly statistics
   */
  async getWeekly(
    sellerId: string,
    weekStart: Date,
  ): Promise<SellerStatistics | null> {
    return this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: StatisticsPeriod.WEEKLY,
        period_start: weekStart,
      },
    });
  }

  /**
   * Get monthly statistics
   */
  async getMonthly(
    sellerId: string,
    year: number,
    month: number,
  ): Promise<SellerStatistics | null> {
    const monthStart = new Date(year, month - 1, 1);

    return this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: StatisticsPeriod.MONTHLY,
        period_start: monthStart,
      },
    });
  }

  /**
   * Get quarterly statistics
   */
  async getQuarterly(
    sellerId: string,
    year: number,
    quarter: number,
  ): Promise<SellerStatistics | null> {
    const quarterStartMonth = (quarter - 1) * 3;
    const quarterStart = new Date(year, quarterStartMonth, 1);

    return this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: StatisticsPeriod.QUARTERLY,
        period_start: quarterStart,
      },
    });
  }

  /**
   * Get yearly statistics
   */
  async getYearly(
    sellerId: string,
    year: number,
  ): Promise<SellerStatistics | null> {
    const yearStart = new Date(year, 0, 1);

    return this.statisticsRepository.findOne({
      where: {
        seller_id: sellerId,
        period_type: StatisticsPeriod.YEARLY,
        period_start: yearStart,
      },
    });
  }

  // ==========================================
  // PERFORMANCE COMPARISON
  // ==========================================

  /**
   * Compare two periods
   */
  async comparePerformance(
    sellerId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Promise<{
    period1: SellerStatistics[];
    period2: SellerStatistics[];
    comparison: {
      sales_growth: number;
      orders_growth: number;
      rating_change: number;
      conversion_rate_change: number;
    };
  }> {
    const period1 = await this.findByPeriod(
      sellerId,
      StatisticsPeriod.DAILY,
      period1Start,
      period1End,
    );

    const period2 = await this.findByPeriod(
      sellerId,
      StatisticsPeriod.DAILY,
      period2Start,
      period2End,
    );

    // Calculate totals for each period
    const period1Total = this.aggregateStatistics(period1);
    const period2Total = this.aggregateStatistics(period2);

    // Calculate growth percentages
    const sales_growth = this.calculateGrowth(
      period1Total.total_sales,
      period2Total.total_sales,
    );
    const orders_growth = this.calculateGrowth(
      period1Total.total_orders,
      period2Total.total_orders,
    );
    const rating_change =
      period2Total.average_rating - period1Total.average_rating;
    const conversion_rate_change =
      period2Total.conversion_rate - period1Total.conversion_rate;

    return {
      period1,
      period2,
      comparison: {
        sales_growth,
        orders_growth,
        rating_change,
        conversion_rate_change,
      },
    };
  }

  // ==========================================
  // LEADERBOARDS
  // ==========================================

  /**
   * Get top sellers by revenue
   */
  async getTopSellersByRevenue(
    limit: number = 10,
    periodType: StatisticsPeriod = StatisticsPeriod.MONTHLY,
    periodStart?: Date,
  ): Promise<SellerStatistics[]> {
    const query = this.statisticsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.seller', 'seller')
      .where('stats.period_type = :periodType', { periodType });

    if (periodStart) {
      query.andWhere('stats.period_start = :periodStart', { periodStart });
    }

    return query
      .orderBy('stats.total_sales', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get top sellers by rating
   */
  async getTopSellersByRating(
    limit: number = 10,
    periodType: StatisticsPeriod = StatisticsPeriod.MONTHLY,
    periodStart?: Date,
  ): Promise<SellerStatistics[]> {
    const query = this.statisticsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.seller', 'seller')
      .where('stats.period_type = :periodType', { periodType })
      .andWhere('stats.reviews_received > 0'); // Must have reviews

    if (periodStart) {
      query.andWhere('stats.period_start = :periodStart', { periodStart });
    }

    return query
      .orderBy('stats.average_rating', 'DESC')
      .addOrderBy('stats.reviews_received', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get top sellers by orders
   */
  async getTopSellersByOrders(
    limit: number = 10,
    periodType: StatisticsPeriod = StatisticsPeriod.MONTHLY,
    periodStart?: Date,
  ): Promise<SellerStatistics[]> {
    const query = this.statisticsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.seller', 'seller')
      .where('stats.period_type = :periodType', { periodType });

    if (periodStart) {
      query.andWhere('stats.period_start = :periodStart', { periodStart });
    }

    return query
      .orderBy('stats.total_orders', 'DESC')
      .limit(limit)
      .getMany();
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Aggregate multiple statistics into totals
   */
  private aggregateStatistics(stats: SellerStatistics[]): {
    total_sales: number;
    total_orders: number;
    average_rating: number;
    conversion_rate: number;
  } {
    if (stats.length === 0) {
      return {
        total_sales: 0,
        total_orders: 0,
        average_rating: 0,
        conversion_rate: 0,
      };
    }

    const total_sales = stats.reduce((sum, s) => sum + s.total_sales, 0);
    const total_orders = stats.reduce((sum, s) => sum + s.total_orders, 0);
    const average_rating =
      stats.reduce((sum, s) => sum + s.average_rating, 0) / stats.length;
    const conversion_rate =
      stats.reduce((sum, s) => sum + s.conversion_rate, 0) / stats.length;

    return {
      total_sales,
      total_orders,
      average_rating,
      conversion_rate,
    };
  }

  /**
   * Calculate growth percentage
   */
  private calculateGrowth(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Get date range for period type
   */
  getPeriodRange(
    periodType: StatisticsPeriod,
    referenceDate: Date = new Date(),
  ): { start: Date; end: Date } {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    switch (periodType) {
      case StatisticsPeriod.DAILY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case StatisticsPeriod.WEEKLY:
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case StatisticsPeriod.MONTHLY:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case StatisticsPeriod.QUARTERLY:
        const currentQuarter = Math.floor(start.getMonth() / 3);
        start.setMonth(currentQuarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(currentQuarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case StatisticsPeriod.YEARLY:
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }
}
