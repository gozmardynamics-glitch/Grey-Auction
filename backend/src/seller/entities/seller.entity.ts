import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Business Types
 */
export enum SellerBusinessType {
  INDIVIDUAL = 'INDIVIDUAL',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  LLC = 'LLC',
  CORPORATION = 'CORPORATION',
  PARTNERSHIP = 'PARTNERSHIP',
}

/**
 * Verification Status
 */
export enum SellerVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Seller Status
 */
export enum SellerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

/**
 * Payout Methods
 */
export enum SellerPayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CRYPTO = 'CRYPTO',
  CHECK = 'CHECK',
}

/**
 * Seller Entity
 * Represents a business/individual selling on the platform
 */
@Entity('sellers')
@Index(['email'], { unique: true })
@Index(['user_id'], { unique: true })
@Index(['verification_status'])
@Index(['status'])
@Index(['business_registration_number'])
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // User Account Link
  // ==========================================
  @Column({ type: 'uuid', unique: true })
  user_id: string;

  // ==========================================
  // Business Information
  // ==========================================
  @Column({ type: 'varchar', length: 255 })
  business_name: string;

  @Column({
    type: 'enum',
    enum: SellerBusinessType,
    default: SellerBusinessType.INDIVIDUAL,
  })
  business_type: SellerBusinessType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_registration_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tax_id: string;

  @Column({ type: 'text', nullable: true })
  business_description: string;

  // ==========================================
  // Contact Information
  // ==========================================
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  // ==========================================
  // Address
  // ==========================================
  @Column({ type: 'varchar', length: 255 })
  address_line1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code: string;

  @Column({ type: 'varchar', length: 2, default: 'NG' })
  country: string; // ISO 3166-1 alpha-2

  // ==========================================
  // Verification
  // ==========================================
  @Column({
    type: 'enum',
    enum: SellerVerificationStatus,
    default: SellerVerificationStatus.PENDING,
  })
  verification_status: SellerVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by_id: string; // Admin who verified

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  // ==========================================
  // Financial Information
  // ==========================================
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commission_rate: number; // Platform fee percentage (default 10%)

  @Column({
    type: 'enum',
    enum: SellerPayoutMethod,
    nullable: true,
  })
  payout_method: SellerPayoutMethod;

  @Column({ type: 'jsonb', nullable: true })
  bank_account_details: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    routing_number?: string;
    swift_code?: string;
    iban?: string;
    // Encrypted in production
  };

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string; // ISO 4217

  // ==========================================
  // Performance Metrics (Cached)
  // ==========================================
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_sales: number;

  @Column({ type: 'int', default: 0 })
  total_products: number;

  @Column({ type: 'int', default: 0 })
  active_products: number;

  @Column({ type: 'int', default: 0 })
  total_orders: number;

  @Column({ type: 'int', default: 0 })
  completed_orders: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number; // Average rating (0-5)

  @Column({ type: 'int', default: 0 })
  total_reviews: number;

  // ==========================================
  // Status & Control
  // ==========================================
  @Column({
    type: 'enum',
    enum: SellerStatus,
    default: SellerStatus.INACTIVE,
  })
  status: SellerStatus;

  @Column({ type: 'text', nullable: true })
  suspension_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date;

  @Column({ type: 'uuid', nullable: true })
  suspended_by_id: string; // Admin who suspended

  // ==========================================
  // Settings & Preferences
  // ==========================================
  @Column({ type: 'boolean', default: true })
  notifications_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  auto_accept_orders: boolean;

  @Column({ type: 'jsonb', nullable: true })
  business_hours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  // ==========================================
  // Metadata
  // ==========================================
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  internal_notes: string; // Admin notes (not visible to seller)

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date; // Soft delete

  // ==========================================
  // Computed Properties
  // ==========================================
  get is_verified(): boolean {
    return this.verification_status === SellerVerificationStatus.APPROVED;
  }

  get is_active(): boolean {
    return this.status === SellerStatus.ACTIVE && this.is_verified;
  }

  get is_suspended(): boolean {
    return this.status === SellerStatus.SUSPENDED;
  }

  get average_rating(): number {
    return this.rating || 0;
  }

  get completion_rate(): number {
    if (this.total_orders === 0) return 0;
    return (this.completed_orders / this.total_orders) * 100;
  }

  get full_address(): string {
    const parts = [
      this.address_line1,
      this.address_line2,
      this.city,
      this.state,
      this.postal_code,
      this.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  
  /**
   * Check if seller can list products
   */
  canListProducts(): boolean {
    return this.is_active;
  }

  /**
   * Check if seller can receive payouts
   */
  canReceivePayouts(): boolean {
    return (
      this.is_active &&
      this.payout_method !== null &&
      this.bank_account_details !== null
    );
  }

  /**
   * Calculate net earnings after commission
   */
  calculateNetEarnings(grossAmount: number): number {
    const commission = (grossAmount * this.commission_rate) / 100;
    return grossAmount - commission;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(data: {
    sales_increment?: number;
    products_increment?: number;
    active_products_delta?: number;
    orders_increment?: number;
    completed_orders_increment?: number;
  }) {
    if (data.sales_increment) {
      this.total_sales += data.sales_increment;
    }
    if (data.products_increment) {
      this.total_products += data.products_increment;
    }
    if (data.active_products_delta !== undefined) {
      this.active_products += data.active_products_delta;
    }
    if (data.orders_increment) {
      this.total_orders += data.orders_increment;
    }
    if (data.completed_orders_increment) {
      this.completed_orders += data.completed_orders_increment;
    }
  }

  /**
   * Update rating
   */
  updateRating(newRating: number) {
    const totalRating = this.rating * this.total_reviews + newRating;
    this.total_reviews += 1;
    this.rating = totalRating / this.total_reviews;
  }
}
