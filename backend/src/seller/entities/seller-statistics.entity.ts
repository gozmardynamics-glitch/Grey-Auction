import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Seller } from './seller.entity';

/**
 * Statistics Period Type
 */
export enum StatisticsPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

/**
 * SellerStatistics Entity
 * Tracks seller performance metrics over time
 */
@Entity('seller_statistics')
@Index(['seller_id'])
@Index(['period_type'])
@Index(['period_start'])
@Index(['period_end'])
@Index(['seller_id', 'period_type', 'period_start'], { unique: true })
export class SellerStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // Seller Reference
  // ==========================================
  @Column({ type: 'uuid' })
  seller_id: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  // ==========================================
  // Period Information
  // ==========================================
  @Column({
    type: 'enum',
    enum: StatisticsPeriod,
  })
  period_type: StatisticsPeriod;

  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'date' })
  period_end: Date;

  // ==========================================
  // Sales Metrics
  // ==========================================
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_sales: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  gross_revenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  commission_paid: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  net_revenue: number;

  @Column({ type: 'int', default: 0 })
  total_orders: number;

  @Column({ type: 'int', default: 0 })
  completed_orders: number;

  @Column({ type: 'int', default: 0 })
  cancelled_orders: number;

  @Column({ type: 'int', default: 0 })
  refunded_orders: number;

  // ==========================================
  // Product Metrics
  // ==========================================
  @Column({ type: 'int', default: 0 })
  products_listed: number; // New products listed

  @Column({ type: 'int', default: 0 })
  products_sold: number; // Unique products sold

  @Column({ type: 'int', default: 0 })
  total_views: number; // Product views

  @Column({ type: 'int', default: 0 })
  total_clicks: number; // Product clicks

  // ==========================================
  // Customer Metrics
  // ==========================================
  @Column({ type: 'int', default: 0 })
  unique_customers: number;

  @Column({ type: 'int', default: 0 })
  repeat_customers: number;

  @Column({ type: 'int', default: 0 })
  new_customers: number;

  // ==========================================
  // Review Metrics
  // ==========================================
  @Column({ type: 'int', default: 0 })
  reviews_received: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ type: 'int', default: 0 })
  positive_reviews: number; // 4-5 stars

  @Column({ type: 'int', default: 0 })
  negative_reviews: number; // 1-2 stars

  // ==========================================
  // Performance Metrics
  // ==========================================
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversion_rate: number; // (orders / views) * 100

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  average_order_value: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completion_rate: number; // (completed / total orders) * 100

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cancellation_rate: number; // (cancelled / total orders) * 100

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  average_response_time_minutes: number; // Average time to respond to orders

  // ==========================================
  // Payout Metrics
  // ==========================================
  @Column({ type: 'int', default: 0 })
  payouts_requested: number;

  @Column({ type: 'int', default: 0 })
  payouts_completed: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_payouts: number;

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  calculated_at: Date;

  // ==========================================
  // Computed Properties
  // ==========================================
  get commission_percentage(): number {
    if (this.gross_revenue === 0) return 0;
    return (this.commission_paid / this.gross_revenue) * 100;
  }

  get customer_retention_rate(): number {
    if (this.unique_customers === 0) return 0;
    return (this.repeat_customers / this.unique_customers) * 100;
  }

  get review_response_rate(): number {
    if (this.reviews_received === 0) return 0;
    // This would need to be calculated from actual response data
    return 0;
  }

  get positive_review_percentage(): number {
    if (this.reviews_received === 0) return 0;
    return (this.positive_reviews / this.reviews_received) * 100;
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  
  /**
   * Calculate all derived metrics
   */
  calculateMetrics() {
    // Conversion rate
    if (this.total_views > 0) {
      this.conversion_rate = (this.total_orders / this.total_views) * 100;
    }

    // Average order value
    if (this.total_orders > 0) {
      this.average_order_value = this.total_sales / this.total_orders;
    }

    // Completion rate
    if (this.total_orders > 0) {
      this.completion_rate = (this.completed_orders / this.total_orders) * 100;
    }

    // Cancellation rate
    if (this.total_orders > 0) {
      this.cancellation_rate = (this.cancelled_orders / this.total_orders) * 100;
    }

    // Net revenue
    this.net_revenue = this.gross_revenue - this.commission_paid;

    this.calculated_at = new Date();
  }

  /**
   * Get period label
   */
  getPeriodLabel(): string {
    const start = this.period_start.toISOString().split('T')[0];
    const end = this.period_end.toISOString().split('T')[0];
    return `${start} to ${end}`;
  }

  /**
   * Check if this is a good performance period
   */
  isGoodPerformance(): boolean {
    return (
      this.completion_rate >= 90 &&
      this.average_rating >= 4.0 &&
      this.cancellation_rate <= 5
    );
  }
}
