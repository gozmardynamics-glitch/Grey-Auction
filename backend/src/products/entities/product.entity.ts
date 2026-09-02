import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, VersionColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CLOSED = 'closed',
  WITHDRAWN = 'withdrawn',
}

export enum AuctionType {
  DIRECT_SALE = 'direct_sale',
  OPEN_AUCTION = 'open_auction',
  EXCLUSIVE = 'exclusive_auction',
}

export enum ProductVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('products')
@Index(['sellerId'])
@Index(['status', 'endTime'])
@Index(['category'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ─── Location (card + detail display) ───────────────────────────
  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  startingBid: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  currentBid: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  subCategory: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column()
  endTime: Date;

  @Column({ default: 0 })
  totalBids: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  reservePrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  buyNowPrice: number;

  @Column({ default: false })
  hasReservePrice: boolean;

  @Column({
    type: 'enum',
    enum: ['hidden', 'exposed'],
    default: 'hidden',
  })
  reservePriceVisibility: 'hidden' | 'exposed';

  @Column({ default: false })
  allowBuyNow: boolean;

  @Column({ default: '7 days' })
  auctionDuration: string;

  @Column({ type: 'enum', enum: AuctionType, default: AuctionType.OPEN_AUCTION })
  auctionType: AuctionType;

  // U5 answer #5 — seller-set minimum bid increment (NGN).
  // null = use the platform's per-price-level ladder.
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  minBidIncrement: number;

  // U5 answer #4 — escrow auto-release window in hours, FIXED AT CREATION.
  // 0 = immediate release on payment (buyer assumed to have inspected and agreed).
  @Column({ type: 'int', default: 72 })
  escrowReleaseHours: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ type: 'enum', enum: ProductVisibility, default: ProductVisibility.PUBLIC })
  visibility: ProductVisibility;

  @ManyToOne(() => User, { nullable: true })
  seller: User;

  @Column()
  sellerId: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
