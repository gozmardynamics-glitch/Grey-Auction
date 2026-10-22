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
import { Product } from '../../products/entities/product.entity';

export enum ProductDocumentType {
  REGISTRATION_CERTIFICATE = 'REGISTRATION_CERTIFICATE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  SERVICE_HISTORY = 'SERVICE_HISTORY',
  OWNERSHIP_PROOF = 'OWNERSHIP_PROOF',
  CUSTOM_CLEARANCE = 'CUSTOM_CLEARANCE',
  OTHER = 'OTHER',
}

export enum ProductDocumentVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('product_documents')
@Index(['productId'])
@Index(['documentType'])
@Index(['verificationStatus'])
export class ProductDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({
    type: 'enum',
    enum: ProductDocumentType,
  })
  documentType: ProductDocumentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  fileHash: string;

  @Column({
    type: 'enum',
    enum: ProductDocumentVerificationStatus,
    default: ProductDocumentVerificationStatus.PENDING,
  })
  verificationStatus: ProductDocumentVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verificationNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedById: string;

  @Column({ type: 'date', nullable: true })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  uploadedAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date;

  get isVerified(): boolean {
    return this.verificationStatus === ProductDocumentVerificationStatus.VERIFIED;
  }

  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }
}