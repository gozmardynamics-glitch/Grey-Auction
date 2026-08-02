import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
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
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @Column({ default: false })
  allowBuyNow: boolean;

  @Column({ default: '7 days' })
  auctionDuration: string;

  @Column({ type: 'enum', enum: AuctionType, default: AuctionType.OPEN_AUCTION })
  auctionType: AuctionType;

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
