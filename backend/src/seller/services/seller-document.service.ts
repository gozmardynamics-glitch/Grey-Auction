import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SellerDocument,
  DocumentType,
  DocumentVerificationStatus,
} from '../entities/seller-document.entity';
import { Seller } from '../entities/seller.entity';
import {
  UploadDocumentDto,
  VerifyDocumentDto,
  UpdateDocumentDto,
} from '../dto';

/**
 * Service for managing seller KYC documents
 */
@Injectable()
export class SellerDocumentService {
  constructor(
    @InjectRepository(SellerDocument)
    private readonly documentRepository: Repository<SellerDocument>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  // ==========================================
  // DOCUMENT UPLOAD & MANAGEMENT
  // ==========================================

  /**
   * Upload a new document
   */
  async upload(
    sellerId: string,
    uploadDto: UploadDocumentDto,
    fileData: {
      url: string;
      filename: string;
      size: number;
      mimetype: string;
      hash?: string;
    },
  ): Promise<SellerDocument> {
    // Verify seller exists
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, deleted_at: null },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if document type already exists and is approved
    const existing = await this.documentRepository.findOne({
      where: {
        seller_id: sellerId,
        document_type: uploadDto.document_type,
        verification_status: DocumentVerificationStatus.APPROVED,
        deleted_at: null,
      },
    });

    if (existing && !existing.is_expired) {
      throw new ConflictException(
        `An approved ${uploadDto.document_type} document already exists`,
      );
    }

    // Create document
    const document = this.documentRepository.create({
      seller_id: sellerId,
      document_type: uploadDto.document_type,
      document_number: uploadDto.document_number,
      description: uploadDto.description,
      file_url: fileData.url,
      file_name: fileData.filename,
      file_size: fileData.size,
      mime_type: fileData.mimetype,
      file_hash: fileData.hash,
      issue_date: uploadDto.issue_date ? new Date(uploadDto.issue_date) : null,
      expires_at: uploadDto.expires_at ? new Date(uploadDto.expires_at) : null,
      verification_status: DocumentVerificationStatus.PENDING,
    });

    return this.documentRepository.save(document);
  }

  /**
   * Find all documents for a seller
   */
  async findBySellerId(
    sellerId: string,
    includeDeleted: boolean = false,
  ): Promise<SellerDocument[]> {
    const where: any = { seller_id: sellerId };
    
    if (!includeDeleted) {
      where.deleted_at = null;
    }

    return this.documentRepository.find({
      where,
      order: { uploaded_at: 'DESC' },
    });
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<SellerDocument> {
    const document = await this.documentRepository.findOne({
      where: { id, deleted_at: null },
      relations: ['seller'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Update document metadata
   */
  async update(
    id: string,
    updateDto: UpdateDocumentDto,
  ): Promise<SellerDocument> {
    const document = await this.findById(id);

    // Only allow updates for pending or rejected documents
    if (
      document.verification_status === DocumentVerificationStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Cannot update approved document. Please upload a new one.',
      );
    }

    // Update fields
    Object.assign(document, {
      ...updateDto,
      issue_date: updateDto.issue_date ? new Date(updateDto.issue_date) : document.issue_date,
      expires_at: updateDto.expires_at ? new Date(updateDto.expires_at) : document.expires_at,
    });

    return this.documentRepository.save(document);
  }

  /**
   * Delete document (soft delete)
   */
  async remove(id: string): Promise<void> {
    const document = await this.findById(id);

    // Cannot delete approved documents
    if (
      document.verification_status === DocumentVerificationStatus.APPROVED
    ) {
      throw new BadRequestException('Cannot delete approved document');
    }

    document.deleted_at = new Date();
    await this.documentRepository.save(document);
  }

  // ==========================================
  // VERIFICATION (ADMIN)
  // ==========================================

  /**
   * Verify document (admin)
   */
  async verify(
    id: string,
    verifyDto: VerifyDocumentDto,
    adminId: string,
  ): Promise<SellerDocument> {
    const document = await this.findById(id);

    // Validate rejection reason
    if (
      verifyDto.verification_status === DocumentVerificationStatus.REJECTED &&
      !verifyDto.rejection_reason
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a document',
      );
    }

    // Update verification
    document.verification_status = verifyDto.verification_status;
    document.verification_notes = verifyDto.verification_notes;
    document.rejection_reason = verifyDto.rejection_reason;
    document.verified_at = new Date();
    document.verified_by_id = adminId;

    return this.documentRepository.save(document);
  }

  /**
   * Get documents pending verification (admin)
   */
  async findPendingVerification(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: SellerDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.documentRepository.findAndCount({
      where: {
        verification_status: DocumentVerificationStatus.PENDING,
        deleted_at: null,
      },
      relations: ['seller'],
      order: { uploaded_at: 'ASC' }, // Oldest first
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ==========================================
  // EXPIRY MANAGEMENT
  // ==========================================

  /**
   * Check and update expired documents
   */
  async checkExpiredDocuments(): Promise<number> {
    const result = await this.documentRepository
      .createQueryBuilder()
      .update(SellerDocument)
      .set({ verification_status: DocumentVerificationStatus.EXPIRED })
      .where('verification_status = :status', { status: DocumentVerificationStatus.APPROVED })
      .andWhere('expires_at < NOW()')
      .andWhere('expires_at IS NOT NULL')
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected || 0;
  }

  /**
   * Get documents expiring soon (within 30 days)
   */
  async findExpiringSoon(): Promise<SellerDocument[]> {
    return this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.seller', 'seller')
      .where('doc.verification_status = :status', { status: DocumentVerificationStatus.APPROVED })
      .andWhere('doc.expires_at IS NOT NULL')
      .andWhere('doc.expires_at BETWEEN NOW() AND NOW() + INTERVAL \'30 days\'')
      .andWhere('doc.deleted_at IS NULL')
      .getMany();
  }

  // ==========================================
  // DOCUMENT VERIFICATION STATUS
  // ==========================================

  /**
   * Get seller's verification completion status
   */
  async getVerificationStatus(sellerId: string): Promise<{
    total_documents: number;
    approved_documents: number;
    pending_documents: number;
    rejected_documents: number;
    expired_documents: number;
    required_documents: DocumentType[];
    missing_documents: DocumentType[];
    is_complete: boolean;
  }> {
    const documents = await this.findBySellerId(sellerId);

    const total_documents = documents.length;
    const approved_documents = documents.filter(
      (d) => d.verification_status === DocumentVerificationStatus.APPROVED && !d.is_expired,
    ).length;
    const pending_documents = documents.filter(
      (d) => d.verification_status === DocumentVerificationStatus.PENDING,
    ).length;
    const rejected_documents = documents.filter(
      (d) => d.verification_status === DocumentVerificationStatus.REJECTED,
    ).length;
    const expired_documents = documents.filter(
      (d) => d.verification_status === DocumentVerificationStatus.EXPIRED,
    ).length;

    // Define required documents
    const required_documents: DocumentType[] = [
      DocumentType.BUSINESS_LICENSE,
      DocumentType.TAX_CERTIFICATE,
      DocumentType.ID_CARD,
      DocumentType.PROOF_OF_ADDRESS,
    ];

    // Find missing documents
    const uploadedTypes = documents
      .filter((d) => d.verification_status === DocumentVerificationStatus.APPROVED && !d.is_expired)
      .map((d) => d.document_type);

    const missing_documents = required_documents.filter(
      (type) => !uploadedTypes.includes(type),
    );

    const is_complete = missing_documents.length === 0;

    return {
      total_documents,
      approved_documents,
      pending_documents,
      rejected_documents,
      expired_documents,
      required_documents,
      missing_documents,
      is_complete,
    };
  }

  /**
   * Check if seller has all required documents approved
   */
  async hasRequiredDocuments(sellerId: string): Promise<boolean> {
    const status = await this.getVerificationStatus(sellerId);
    return status.is_complete;
  }
}
