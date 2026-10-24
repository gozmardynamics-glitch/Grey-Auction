import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { KycService } from './kyc.service';
import {
  KycDocumentRequirement,
  KycRequirementAudience,
} from './entities/kyc-document-requirement.entity';
import { KycDocument, KycDocumentStatus } from './entities/kyc-document.entity';
import { Seller } from '../seller/entities/seller.entity';

describe('KycService', () => {
  let service: KycService;

  const requirements = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const documents = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const sellers = { findOne: jest.fn(), save: jest.fn() };

  const requirement = (over: Partial<KycDocumentRequirement> = {}) =>
    ({
      id: 'req-1',
      code: 'national_id',
      name: 'National ID Card',
      description: null,
      audience: KycRequirementAudience.BUYER,
      isRequired: true,
      isActive: true,
      sortOrder: 0,
      allowedMimeTypes: null,
      maxSizeMb: 10,
      ...over,
    }) as KycDocumentRequirement;

  const document = (over: Partial<KycDocument> = {}) =>
    ({
      id: 'doc-1',
      userId: 'user-1',
      requirementId: 'req-1',
      fileName: 'id.pdf',
      fileSize: 1000,
      mimeType: 'application/pdf',
      status: KycDocumentStatus.PENDING,
      reviewNotes: null,
      reviewedAt: null,
      expiresAt: null,
      createdAt: new Date('2026-01-01'),
      ...over,
    }) as KycDocument;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getRepositoryToken(KycDocumentRequirement), useValue: requirements },
        { provide: getRepositoryToken(KycDocument), useValue: documents },
        { provide: getRepositoryToken(Seller), useValue: sellers },
      ],
    }).compile();
    service = module.get<KycService>(KycService);
  });

  // ── Admin: requirements ────────────────────────────────────────────────

  it('admin can name a new document requirement', async () => {
    requirements.findOne.mockResolvedValue(null);
    requirements.create.mockImplementation((x) => x);
    requirements.save.mockImplementation(async (x) => x);

    const created = await service.createRequirement('admin-1', {
      code: 'utility_bill',
      name: 'Utility Bill',
      description: 'Last 3 months',
    });

    expect(created.name).toBe('Utility Bill');
    expect(created.createdById).toBe('admin-1');
    expect(created.audience).toBe(KycRequirementAudience.BUYER);
    expect(created.isRequired).toBe(true);
  });

  it('rejects a duplicate requirement code', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    await expect(
      service.createRequirement('admin-1', { code: 'national_id', name: 'Dup' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates rather than deletes a requirement, preserving history', async () => {
    const existing = requirement();
    requirements.findOne.mockResolvedValue(existing);
    requirements.save.mockImplementation(async (x) => x);

    const result = await service.deactivateRequirement('req-1');

    expect(result.isActive).toBe(false);
    expect(requirements.save).toHaveBeenCalled();
  });

  // ── Checklist / status ─────────────────────────────────────────────────

  it('builds a checklist showing the latest submission per requirement', async () => {
    requirements.find.mockResolvedValue([requirement()]);
    documents.find.mockResolvedValue([
      document({ id: 'newer', status: KycDocumentStatus.PENDING }),
      document({ id: 'older', status: KycDocumentStatus.REJECTED }),
    ]);

    const checklist = await service.checklistFor('user-1');

    expect(checklist).toHaveLength(1);
    expect(checklist[0].code).toBe('national_id');
    expect(checklist[0].document?.id).toBe('newer');
    expect(checklist[0].document?.status).toBe(KycDocumentStatus.PENDING);
  });

  it('is verified only when every required document is approved', async () => {
    requirements.find.mockResolvedValue([
      requirement({ id: 'req-1', code: 'national_id' }),
      requirement({ id: 'req-2', code: 'proof_of_address' }),
    ]);
    documents.find.mockResolvedValue([
      document({ id: 'd1', requirementId: 'req-1', status: KycDocumentStatus.APPROVED }),
      document({ id: 'd2', requirementId: 'req-2', status: KycDocumentStatus.PENDING }),
    ]);

    const status = await service.statusFor('user-1');

    expect(status.isVerified).toBe(false);
    expect(status.requiredTotal).toBe(2);
    expect(status.requiredApproved).toBe(1);
    expect(status.pendingReview).toBe(1);
    expect(status.outstanding).toEqual([
      { code: 'proof_of_address', name: 'National ID Card' },
    ]);
  });

  it('reports verified when all required documents are approved', async () => {
    requirements.find.mockResolvedValue([requirement()]);
    documents.find.mockResolvedValue([
      document({ status: KycDocumentStatus.APPROVED }),
    ]);

    const status = await service.statusFor('user-1');
    expect(status.isVerified).toBe(true);
    expect(status.outstanding).toHaveLength(0);
  });

  it('does not block an account holder when no requirements are configured', async () => {
    requirements.find.mockResolvedValue([]);
    const status = await service.statusFor('user-1');
    expect(status.isVerified).toBe(true);
    expect(status.requiredTotal).toBe(0);
    expect(status.checklist).toEqual([]);
  });

  it('optional documents do not gate verified status', async () => {
    requirements.find.mockResolvedValue([
      requirement({ id: 'req-1', isRequired: true }),
      requirement({ id: 'req-2', code: 'optional_extra', isRequired: false }),
    ]);
    documents.find.mockResolvedValue([
      document({ id: 'd1', requirementId: 'req-1', status: KycDocumentStatus.APPROVED }),
    ]);

    const status = await service.statusFor('user-1');
    expect(status.requiredTotal).toBe(1);
    expect(status.isVerified).toBe(true);
  });

  // ── Submission ─────────────────────────────────────────────────────────

  it('submitting replaces the previous file for the same requirement', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    documents.delete.mockResolvedValue({});
    documents.create.mockImplementation((x) => x);
    documents.save.mockImplementation(async (x) => x);

    const saved = await service.submitDocument('user-1', {
      requirementCode: 'national_id',
      fileUrl: 'https://cdn.example.com/id.pdf',
      fileName: 'id.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
    });

    expect(documents.delete).toHaveBeenCalledWith({
      userId: 'user-1',
      requirementId: 'req-1',
    });
    expect(saved.status).toBe(KycDocumentStatus.PENDING);
    expect(saved.userId).toBe('user-1');
  });

  it('rejects a document for an unknown or inactive requirement', async () => {
    requirements.findOne.mockResolvedValue(requirement({ isActive: false }));
    await expect(
      service.submitDocument('user-1', {
        requirementCode: 'national_id',
        fileUrl: 'https://cdn.example.com/id.pdf',
        fileName: 'id.pdf',
        fileSize: 10,
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces the requirement MIME allowlist', async () => {
    requirements.findOne.mockResolvedValue(
      requirement({ allowedMimeTypes: ['application/pdf'] }),
    );
    await expect(
      service.submitDocument('user-1', {
        requirementCode: 'national_id',
        fileUrl: 'https://cdn.example.com/id.exe',
        fileName: 'id.exe',
        fileSize: 10,
        mimeType: 'application/octet-stream',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces the requirement size cap', async () => {
    requirements.findOne.mockResolvedValue(requirement({ maxSizeMb: 2 }));
    await expect(
      service.submitDocument('user-1', {
        requirementCode: 'national_id',
        fileUrl: 'https://cdn.example.com/id.pdf',
        fileName: 'id.pdf',
        fileSize: 3 * 1024 * 1024,
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot withdraw an approved document', async () => {
    documents.findOne.mockResolvedValue(
      document({ status: KycDocumentStatus.APPROVED }),
    );
    await expect(
      service.withdrawDocument('user-1', 'doc-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot withdraw somebody else document', async () => {
    documents.findOne.mockResolvedValue(document({ userId: 'user-2' }));
    await expect(
      service.withdrawDocument('user-1', 'doc-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('withdraws a pending document', async () => {
    documents.findOne.mockResolvedValue(document());
    documents.delete.mockResolvedValue({});
    await expect(service.withdrawDocument('user-1', 'doc-1')).resolves.toBeUndefined();
    expect(documents.delete).toHaveBeenCalledWith({ id: 'doc-1' });
  });

  // ── Review ─────────────────────────────────────────────────────────────

  it('approving records the reviewer and timestamp', async () => {
    documents.findOne.mockResolvedValue(document());
    documents.save.mockImplementation(async (x) => x);

    const result = await service.reviewDocument('doc-1', 'admin-1', {
      status: KycDocumentStatus.APPROVED,
    });

    expect(result.status).toBe(KycDocumentStatus.APPROVED);
    expect(result.reviewedById).toBe('admin-1');
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  it('rejecting requires reviewer notes', async () => {
    documents.findOne.mockResolvedValue(document());
    await expect(
      service.reviewDocument('doc-1', 'admin-1', {
        status: KycDocumentStatus.REJECTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejection keeps the admin feedback for the account holder', async () => {
    documents.findOne.mockResolvedValue(document());
    documents.save.mockImplementation(async (x) => x);

    const result = await service.reviewDocument('doc-1', 'admin-1', {
      status: KycDocumentStatus.REJECTED,
      reviewNotes: 'Expiry date is not visible.',
    });

    expect(result.status).toBe(KycDocumentStatus.REJECTED);
    expect(result.reviewNotes).toBe('Expiry date is not visible.');
  });

  it('reviewing a missing document 404s', async () => {
    documents.findOne.mockResolvedValue(null);
    await expect(
      service.reviewDocument('nope', 'admin-1', {
        status: KycDocumentStatus.APPROVED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
