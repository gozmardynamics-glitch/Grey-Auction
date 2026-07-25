import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Seller } from './seller.entity';

/**
 * Review Status
 */
export enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

/**
 * SellerReview Entity
 * Customer reviews and ratings for sellers
 */
@Entity('seller_reviews')
@Index(['seller_id'])
@Index(['bidder_id'])
@Index(['auction_id'])
@Index(['rating'])
@Index(['status'])
@Index(['created_at'])
export class SellerReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // References
  // ==========================================
  @Column({ type: 'uuid' })
  seller_id: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @Column({ type: 'uuid' })
  bidder_id: string; // Who left the review (from users/bidders table)

  @Column({ type: 'uuid', nullable: true })
  auction_id: string; // Related auction (if applicable)

  @Column({ type: 'uuid', nullable: true })
  product_id: string; // Related product

  // ==========================================
  // Review Content
  // ==========================================
  @Column({ type: 'int' })
  rating: number; // 1-5 stars

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string; // Review title/summary

  // ==========================================
  // Sub-Ratings (Optional)
  // ==========================================
  @Column({ type: 'int', nullable: true })
  communication_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  product_quality_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  shipping_speed_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  packaging_rating: number; // 1-5

  // ==========================================
  // Seller Response
  // ==========================================
  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date;

  // ==========================================
  // Status & Moderation
  // ==========================================
  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.ACTIVE,
  })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  flag_reason: string;

  @Column({ type: 'uuid', nullable: true })
  flagged_by_id: string; // Admin who flagged

  @Column({ type: 'timestamp', nullable: true })
  flagged_at: Date;

  @Column({ type: 'boolean', default: false })
  is_verified_purchase: boolean;

  // ==========================================
  // Helpfulness Tracking
  // ==========================================
  @Column({ type: 'int', default: 0 })
  helpful_count: number; // How many found this helpful

  @Column({ type: 'int', default: 0 })
  not_helpful_count: number;

  // ==========================================
  // Images (Optional)
  // ==========================================
  @Column({ type: 'jsonb', nullable: true })
  images: string[]; // Array of image URLs

  // ==========================================
  // Metadata
  // ==========================================
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date;

  // ==========================================
  // Computed Properties
  // ==========================================
  get is_active(): boolean {
    return this.status === ReviewStatus.ACTIVE;
  }

  get is_flagged(): boolean {
    return this.status === ReviewStatus.FLAGGED;
  }

  get has_response(): boolean {
    return this.response !== null && this.response.trim() !== '';
  }

  get average_sub_rating(): number | null {
    const ratings = [
      this.communication_rating,
      this.product_quality_rating,
      this.shipping_speed_rating,
      this.packaging_rating,
    ].filter((r) => r !== null);

    if (ratings.length === 0) return null;

    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  get helpfulness_ratio(): number {
    const total = this.helpful_count + this.not_helpful_count;
    if (total === 0) return 0;
    return (this.helpful_count / total) * 100;
  }

  get days_since_posted(): number {
    const now = new Date();
    const diff = now.getTime() - this.created_at.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  
  /**
   * Check if rating is positive (4-5 stars)
   */
  isPositive(): boolean {
    return this.rating >= 4;
  }

  /**
   * Check if rating is negative (1-2 stars)
   */
  isNegative(): boolean {
    return this.rating <= 2;
  }

  /**
   * Mark as helpful
   */
  markHelpful() {
    this.helpful_count += 1;
  }

  /**
   * Mark as not helpful
   */
  markNotHelpful() {
    this.not_helpful_count += 1;
  }

  /**
   * Add seller response
   */
  addResponse(response: string) {
    this.response = response;
    this.responded_at = new Date();
  }
}
