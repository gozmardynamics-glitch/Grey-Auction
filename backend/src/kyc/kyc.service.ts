import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  KycDocumentRequirement,
  KycRequirementAudience,
} from './entities/kyc-document-requirement.entity';
import { KycDocument, KycDocumentStatus } from './entities/kyc-document.entity';
import { Seller } from '../seller/entities/seller.entity';
import { StorageService } from '../common/storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import {
  CreateKycRequirementDto,
  ReviewKycDocumentDto,
  UpdateKycRequirementDto,
  UploadKycDocumentDto,
} from './dto/kyc.dto';

/** What the storage layer actually stored, derived server-side. */
export interface StoredKycFile {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface KycChecklistItem {
  requirementId: string;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  maxSizeMb: number;
  allowedMimeTypes: string[];
  /** Latest document the account holder submitted for this requirement. */
  document: {
    id: string;
    fileName: string;
    status: KycDocumentStatus;
    reviewNotes: string | null;
    reviewedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  } | null;
}

export interface KycStatus {
  /** True when every required, active requirement has an approved document. */
  isVerified: boolean;
  requiredTotal: number;
  requiredApproved: number;
  pendingReview: number;
  rejected: number;
  outstanding: Array<{ code: string; name: string }>;
  checklist: KycChecklistItem[];
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycDocumentRequirement)
    private readonly requirements: Repository<KycDocumentRequirement>,
    @InjectRepository(KycDocument)
    private readonly documents: Repository<KycDocument>,
    @InjectRepository(Seller)
    private readonly sellers: Repository<Seller>,
    private readonly storage: StorageService,
    private readonly notifications: NotificationService,
  ) {}

  // ── Admin: document requirements ───────────────────────────────────────

  async listRequirements(
    includeInactive = false,
  ): Promise<KycDocumentRequirement[]> {
    return this.requirements.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createRequirement(
    adminId: string,
    dto: CreateKycRequirementDto,
  ): Promise<KycDocumentRequirement> {
    const existing = await this.requirements.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `A KYC requirement with code "${dto.code}" already exists`,
      );
    }
    return this.requirements.save(
      this.requirements.create({
        ...dto,
        audience: dto.audience ?? KycRequirementAudience.BUYER,
        isRequired: dto.isRequired ?? true,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        maxSizeMb: dto.maxSizeMb ?? 10,
        createdById: adminId,
      }),
    );
  }

  async updateRequirement(
    id: string,
    dto: UpdateKycRequirementDto,
  ): Promise<KycDocumentRequirement> {
    const requirement = await this.requirements.findOne({ where: { id } });
    if (!requirement) throw new NotFoundException('KYC requirement not found');
    Object.assign(requirement, dto);
    return this.requirements.save(requirement);
  }

  /**
   * Requirements are never hard-deleted: documents reference them, and a
   * review needs to know what was asked at the time. Deactivating stops new
   * submissions while preserving history.
   */
  async deactivateRequirement(id: string): Promise<KycDocumentRequirement> {
    const requirement = await this.requirements.findOne({ where: { id } });
    if (!requirement) throw new NotFoundException('KYC requirement not found');
    requirement.isActive = false;
    return this.requirements.save(requirement);
  }

  // ── Account holder ────────────────────────────────────────────────────

  /**
   * Which requirement audiences apply to this account holder.
   *
   * Everyone is a buyer; an account holder who has a seller profile also
   * answers seller-scoped requirements. (This used to hard-code BUYER, so
   * requirements marked 'seller' were invisible forever.)
   */
  private async audiencesFor(userId: string): Promise<KycRequirementAudience[]> {
    const isSeller = await this.sellers.exists({ where: { user_id: userId } });
    return isSeller
      ? [KycRequirementAudience.BUYER, KycRequirementAudience.SELLER]
      : [KycRequirementAudience.BUYER];
  }

  /** Active requirements for this holder (buyer, plus seller when applicable). */
  async checklistFor(userId: string): Promise<KycChecklistItem[]> {
    const audiences = await this.audiencesFor(userId);
    const requirements = await this.requirements.find({
      where: [
        { isActive: true, audience: In(audiences) },
        { isActive: true, audience: KycRequirementAudience.BOTH },
      ],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (requirements.length === 0) return [];

    const docs = await this.documents.find({
      where: {
        userId,
        requirementId: In(requirements.map((r) => r.id)),
      },
      order: { createdAt: 'DESC' },
    });

    // Newest first, so the first hit per requirement is the latest upload.
    const latest = new Map<string, KycDocument>();
    for (const doc of docs) {
      if (!latest.has(doc.requirementId)) latest.set(doc.requirementId, doc);
    }

    return requirements.map((requirement) => {
      const doc = latest.get(requirement.id);
      return {
        requirementId: requirement.id,
        code: requirement.code,
        name: requirement.name,
        description: requirement.description ?? null,
        isRequired: requirement.isRequired,
        maxSizeMb: requirement.maxSizeMb,
        allowedMimeTypes: requirement.allowedMimeTypes ?? [],
        document: doc
          ? {
              id: doc.id,
              fileName: doc.fileName,
              status: doc.status,
              reviewNotes: doc.reviewNotes ?? null,
              reviewedAt: doc.reviewedAt ?? null,
              expiresAt: doc.expiresAt ?? null,
              createdAt: doc.createdAt,
            }
          : null,
      };
    });
  }

  async statusFor(userId: string): Promise<KycStatus> {
    const checklist = await this.checklistFor(userId);
    const required = checklist.filter((item) => item.isRequired);

    const requiredApproved = required.filter(
      (item) => item.document?.status === KycDocumentStatus.APPROVED,
    ).length;

    const outstanding = required
      .filter((item) => item.document?.status !== KycDocumentStatus.APPROVED)
      .map((item) => ({ code: item.code, name: item.name }));

    const pendingReview = checklist.filter(
      (item) => item.document?.status === KycDocumentStatus.PENDING,
    ).length;
    const rejected = checklist.filter(
      (item) => item.document?.status === KycDocumentStatus.REJECTED,
    ).length;

    return {
      // No requirements configured means nothing is outstanding, so the holder
      // is not blocked by a feature nobody switched on.
      isVerified: required.length === 0 ? true : requiredApproved === required.length,
      requiredTotal: required.length,
      requiredApproved,
      pendingReview,
      rejected,
      outstanding,
      checklist,
    };
  }

  /**
   * Validate an upload against the requirement BEFORE the bytes are stored:
   * an unacceptable file must never leave an orphaned object behind.
   * Returns the requirement so the caller can label the upload.
   */
  async assertUploadAllowed(
    requirementCode: string,
    mimeType: string,
    size: number,
  ): Promise<KycDocumentRequirement> {
    const requirement = await this.requireActiveRequirement(requirementCode);

    if (
      requirement.allowedMimeTypes?.length &&
      !requirement.allowedMimeTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        `File type ${mimeType} is not accepted for ${requirement.name}`,
      );
    }

    const maxBytes = (requirement.maxSizeMb || 10) * 1024 * 1024;
    if (size > maxBytes) {
      throw new BadRequestException(
        `File exceeds ${requirement.maxSizeMb} MB for ${requirement.name}`,
      );
    }
    return requirement;
  }

  private async requireActiveRequirement(
    requirementCode: string,
  ): Promise<KycDocumentRequirement> {
    const requirement = await this.requirements.findOne({
      where: { code: requirementCode },
    });
    if (!requirement || !requirement.isActive) {
      throw new BadRequestException(
        `Unknown or inactive KYC requirement: ${requirementCode}`,
      );
    }
    return requirement;
  }

  /**
   * Record an uploaded KYC document.
   *
   * Every file attribute comes from what was actually stored (StoredKycFile),
   * never from the request, so the MIME and size policy cannot be bypassed by
   * claiming the file is something else.
   */
  async submitUpload(
    userId: string,
    dto: UploadKycDocumentDto,
    stored: StoredKycFile,
  ): Promise<KycDocument> {
    const requirement = await this.requireActiveRequirement(
      dto.requirementCode,
    );

    const maxBytes = (requirement.maxSizeMb || 10) * 1024 * 1024;
    if (stored.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds ${requirement.maxSizeMb} MB for ${requirement.name}`,
      );
    }

    const expiresAt = this.parseExpiry(dto.expiresAt);

    // A superseded upload is replaced so the checklist always shows one current
    // file per requirement and the review queue never holds stale duplicates.
    // The old ROWS are removed (not just their files — deleting only the files
    // leaves rows pointing at objects that no longer exist), and the objects go
    // with them.
    const superseded = await this.documents.find({
      where: { userId, requirementId: requirement.id },
    });

    const saved = await this.documents.save(
      this.documents.create({
        userId,
        requirementId: requirement.id,
        fileUrl: stored.url,
        fileName: stored.fileName,
        fileSize: stored.size,
        mimeType: stored.mimeType,
        documentNumber: dto.documentNumber,
        expiresAt,
        status: KycDocumentStatus.PENDING,
      }),
    );

    for (const old of superseded) {
      await this.documents.delete({ id: old.id });
      await this.storage.deleteFile(old.fileUrl).catch(() => undefined);
    }
    return saved;
  }

  /** `expiresAt` is optional; when given it must be a real, future date. */
  private parseExpiry(raw?: string): Date | null {
    if (!raw) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('expiresAt is not a valid date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) {
      throw new BadRequestException('expiresAt must be today or later');
    }
    return parsed;
  }

  async listMyDocuments(userId: string): Promise<KycDocument[]> {
    return this.documents.find({
      where: { userId },
      relations: ['requirement'],
      order: { createdAt: 'DESC' },
    });
  }

  async withdrawDocument(userId: string, documentId: string): Promise<void> {
    const doc = await this.documents.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('KYC document not found');
    if (doc.userId !== userId) {
      throw new NotFoundException('KYC document not found');
    }
    if (doc.status === KycDocumentStatus.APPROVED) {
      throw new BadRequestException(
        'An approved document cannot be withdrawn; upload a replacement instead',
      );
    }
    await this.documents.delete({ id: documentId });
  }

  /**
   * Record the admin's publishing decision for a seller.
   *
   * Deliberately separate from KYC approval: KYC passing says the documents are
   * good, it does not authorise publishing. Also writes the compliance score and
   * band that the decision was taken against, so the record shows what the admin
   * actually saw.
   */
  async decidePublishing(
    userId: string,
    adminId: string,
    approved: boolean,
    note: string | undefined,
    assessment: { complianceScore: number; band: string },
  ): Promise<Seller> {
    const seller = await this.sellers.findOne({ where: { user_id: userId } });
    if (!seller) throw new NotFoundException('Seller profile not found for this account');

    seller.compliance_score = assessment.complianceScore;
    seller.risk_band = assessment.band;
    seller.publish_approved = approved;
    seller.publish_decision_note = note ?? null;
    seller.publish_decided_by = adminId;
    seller.publish_decided_at = new Date();
    return this.sellers.save(seller);
  }

  /** Publishing state as the seller is allowed to see it. */
  async publishingStateFor(userId: string): Promise<{
    publishApproved: boolean;
    complianceScore: number;
    band: string;
    decisionNote: string | null;
    decidedAt: Date | null;
    /** False for a pure buyer: there is no seller record to authorise. */
    hasSellerProfile: boolean;
  }> {
    const seller = await this.sellers.findOne({ where: { user_id: userId } });
    return {
      publishApproved: seller?.publish_approved === true,
      complianceScore: seller?.compliance_score ?? 0,
      band: seller?.risk_band ?? 'high',
      decisionNote: seller?.publish_decision_note ?? null,
      decidedAt: seller?.publish_decided_at ?? null,
      hasSellerProfile: Boolean(seller),
    };
  }

  // ── Admin: review queue ───────────────────────────────────────────────

  async listDocumentsForReview(
    status?: KycDocumentStatus,
    page = 1,
    limit = 50,
  ): Promise<{ data: KycDocument[]; total: number; page: number; limit: number }> {
    const take = Math.min(limit, 200);
    const [data, total] = await this.documents.findAndCount({
      where: status ? { status } : {},
      relations: ['requirement'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * take,
      take,
    });
    return { data, total, page, limit: take };
  }

  async reviewDocument(
    documentId: string,
    adminId: string,
    dto: ReviewKycDocumentDto,
  ): Promise<KycDocument> {
    const doc = await this.documents.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('KYC document not found');

    if (dto.status === KycDocumentStatus.REJECTED && !dto.reviewNotes?.trim()) {
      throw new BadRequestException(
        'reviewNotes is required when rejecting a document',
      );
    }

    doc.status = dto.status;
    doc.reviewNotes = dto.reviewNotes ?? null;
    doc.reviewedById = adminId;
    doc.reviewedAt = new Date();
    const saved = await this.documents.save(doc);
    this.logger.log(
      `KYC document ${doc.id} (user ${doc.userId}) ${dto.status} by admin ${adminId}`,
    );

    // Tell the applicant instead of making them poll the page. A notification
    // failure must never fail the review that already committed.
    void this.notifications
      .create(doc.userId, {
        type: NotificationType.SYSTEM,
        title:
          dto.status === KycDocumentStatus.APPROVED
            ? 'Your document was approved'
            : 'Your document needs attention',
        body:
          dto.status === KycDocumentStatus.APPROVED
            ? 'A document you submitted has been approved.'
            : `A document you submitted was rejected: ${dto.reviewNotes?.trim() ?? 'see the review notes'}`,
        link: '/buyer/dashboard?module=verification',
      })
      .catch(() => undefined);

    return saved;
  }
}
