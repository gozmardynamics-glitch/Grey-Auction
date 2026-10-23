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
import { KycDocumentRequirement } from './kyc-document-requirement.entity';

export enum KycDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * One uploaded document from an account holder, answering one requirement.
 *
 * The account holder uploads and the admin reviews; the platform never infers
 * approval. A re-upload supersedes the previous file for the same requirement.
 */
@Entity('kyc_documents')
@Index(['userId'])
@Index(['requirementId'])
@Index(['status'])
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The account holder who uploaded it. */
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  requirementId: string;

  @ManyToOne(() => KycDocumentRequirement, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requirementId' })
  requirement: KycDocumentRequirement;

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  /** Admin-supplied reference, e.g. the ID number on the document. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  documentNumber: string;

  @Column({
    type: 'enum',
    enum: KycDocumentStatus,
    default: KycDocumentStatus.PENDING,
  })
  status: KycDocumentStatus;

  /** Admin feedback; required when rejecting. */
  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'date', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
