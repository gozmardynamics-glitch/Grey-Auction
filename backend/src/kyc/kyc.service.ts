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
import {
  CreateKycRequirementDto,
  ReviewKycDocumentDto,
  SubmitKycDocumentDto,
  UpdateKycRequirementDto,
} from './dto/kyc.dto';

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

  private audienceFor(): KycRequirementAudience {
    // One account holder both bids and sells, so buyer-facing KYC also honours
    // requirements marked 'both'.
    return KycRequirementAudience.BUYER;
  }

  /** Active requirements for buyers, each joined to the holder's latest upload. */
  async checklistFor(userId: string): Promise<KycChecklistItem[]> {
    const audience = this.audienceFor();
    const requirements = await this.requirements.find({
      where: [
        { isActive: true, audience },
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

  async submitDocument(
    userId: string,
    dto: SubmitKycDocumentDto,
  ): Promise<KycDocument> {
    const requirement = await this.requirements.findOne({
      where: { code: dto.requirementCode },
    });
    if (!requirement || !requirement.isActive) {
      throw new BadRequestException(
        `Unknown or inactive KYC requirement: ${dto.requirementCode}`,
      );
    }

    if (
      requirement.allowedMimeTypes?.length &&
      !requirement.allowedMimeTypes.includes(dto.mimeType)
    ) {
      throw new BadRequestException(
        `File type ${dto.mimeType} is not accepted for ${requirement.name}`,
      );
    }

    const maxBytes = (requirement.maxSizeMb || 10) * 1024 * 1024;
    if (dto.fileSize > maxBytes) {
      throw new BadRequestException(
        `File exceeds ${requirement.maxSizeMb} MB for ${requirement.name}`,
      );
    }

    // A superseded upload is removed so the checklist always shows one current
    // file per requirement and the review queue never holds stale duplicates.
    await this.documents.delete({
      userId,
      requirementId: requirement.id,
    });

    return this.documents.save(
      this.documents.create({
        userId,
        requirementId: requirement.id,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        documentNumber: dto.documentNumber,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        status: KycDocumentStatus.PENDING,
      }),
    );
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
    return saved;
  }
}
