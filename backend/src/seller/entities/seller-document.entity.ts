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
 * Document Types for KYC
 */
export enum DocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CERTIFICATE_OF_INCORPORATION = 'CERTIFICATE_OF_INCORPORATION',
  MEMORANDUM_OF_ASSOCIATION = 'MEMORANDUM_OF_ASSOCIATION',
  OTHER = 'OTHER',
}

/**
 * Document Verification Status
 */
export enum DocumentVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * SellerDocument Entity
 * Stores KYC documents uploaded by sellers
 */
@Entity('seller_documents')
@Index(['seller_id'])
@Index(['document_type'])
@Index(['verification_status'])
@Index(['expires_at'])
export class SellerDocument {
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
  // Document Information
  // ==========================================
  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  document_type: DocumentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  document_number: string; // e.g., License number, ID number

  @Column({ type: 'text', nullable: true })
  description: string;

  // ==========================================
  // File Information
  // ==========================================
  @Column({ type: 'varchar', length: 500 })
  file_url: string; // S3/GCS URL

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'int' })
  file_size: number; // in bytes

  @Column({ type: 'varchar', length: 100 })
  mime_type: string; // e.g., application/pdf, image/jpeg

  @Column({ type: 'varchar', length: 64, nullable: true })
  file_hash: string; // SHA-256 hash for integrity

  // ==========================================
  // Verification
  // ==========================================
  @Column({
    type: 'enum',
    enum: DocumentVerificationStatus,
    default: DocumentVerificationStatus.PENDING,
  })
  verification_status: DocumentVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by_id: string; // Admin who verified

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  // ==========================================
  // Validity
  // ==========================================
  @Column({ type: 'date', nullable: true })
  issue_date: Date; // When document was issued

  @Column({ type: 'date', nullable: true })
  expires_at: Date; // When document expires

  // ==========================================
  // Metadata
  // ==========================================
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  uploaded_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date;

  // ==========================================
  // Computed Properties
  // ==========================================
  get is_verified(): boolean {
    return this.verification_status === DocumentVerificationStatus.APPROVED;
  }

  get is_expired(): boolean {
    if (!this.expires_at) return false;
    return new Date() > new Date(this.expires_at);
  }

  get is_pending_review(): boolean {
    return (
      this.verification_status === DocumentVerificationStatus.PENDING ||
      this.verification_status === DocumentVerificationStatus.UNDER_REVIEW
    );
  }

  get days_until_expiry(): number | null {
    if (!this.expires_at) return null;
    const now = new Date();
    const expiry = new Date(this.expires_at);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  
  /**
   * Check if document needs renewal (expires in 30 days)
   */
  needsRenewal(): boolean {
    const days = this.days_until_expiry;
    return days !== null && days <= 30 && days > 0;
  }

  /**
   * Mark as expired if past expiry date
   */
  checkAndUpdateExpiry(): void {
    if (this.is_expired && this.verification_status !== DocumentVerificationStatus.EXPIRED) {
      this.verification_status = DocumentVerificationStatus.EXPIRED;
    }
  }
}
