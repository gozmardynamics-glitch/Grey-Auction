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
import { StorageService } from '../common/storage/storage.service';
import { NotificationService } from '../notification/notification.service';

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
  const sellers = { findOne: jest.fn(), exists: jest.fn(), save: jest.fn() };
  const storage = { uploadFile: jest.fn(), deleteFile: jest.fn().mockResolvedValue(undefined) };

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
    // Default: the holder has no seller profile → buyer requirements only.
    sellers.exists.mockResolvedValue(false);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getRepositoryToken(KycDocumentRequirement), useValue: requirements },
        { provide: getRepositoryToken(KycDocument), useValue: documents },
        { provide: getRepositoryToken(Seller), useValue: sellers },
        { provide: StorageService, useValue: storage },
        {
          provide: NotificationService,
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
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

  // ── Submission (server-derived file metadata) ─────────────────────────

  const stored = {
    url: 'https://cdn.example.com/kyc/id.pdf',
    fileName: 'id.pdf',
    size: 2048,
    mimeType: 'application/pdf',
  };

  it('records the stored file and replaces the previous submission', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    documents.find.mockResolvedValue([
      document({ id: 'old', fileUrl: 'https://cdn.example.com/kyc/old.pdf' }),
    ]);
    documents.create.mockImplementation((x) => x);
    documents.save.mockImplementation(async (x) => x);

    const saved = await service.submitUpload(
      'user-1',
      { requirementCode: 'national_id' },
      stored,
    );

    expect(saved.status).toBe(KycDocumentStatus.PENDING);
    expect(saved.userId).toBe('user-1');
    // Metadata comes from the stored object, never from the request.
    expect(saved.fileUrl).toBe(stored.url);
    expect(saved.fileSize).toBe(stored.size);
    expect(saved.mimeType).toBe(stored.mimeType);
    // The superseded ROW is replaced, and its stored object removed with it —
    // deleting only the file would leave a row pointing at nothing.
    expect(documents.delete).toHaveBeenCalledWith({ id: 'old' });
    expect(storage.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/kyc/old.pdf');
  });

  it('rejects a document for an unknown or inactive requirement', async () => {
    requirements.findOne.mockResolvedValue(requirement({ isActive: false }));
    await expect(
      service.submitUpload('user-1', { requirementCode: 'national_id' }, stored),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces the requirement MIME allowlist before upload', async () => {
    requirements.findOne.mockResolvedValue(
      requirement({ allowedMimeTypes: ['application/pdf'] }),
    );
    await expect(
      service.assertUploadAllowed('national_id', 'application/octet-stream', 10),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces the requirement size cap before upload', async () => {
    requirements.findOne.mockResolvedValue(requirement({ maxSizeMb: 2 }));
    await expect(
      service.assertUploadAllowed('national_id', 'application/pdf', 3 * 1024 * 1024),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expiry date in the past', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    await expect(
      service.submitUpload(
        'user-1',
        { requirementCode: 'national_id', expiresAt: '2020-01-01' },
        stored,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unparseable expiry date instead of storing Invalid Date', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    await expect(
      service.submitUpload(
        'user-1',
        { requirementCode: 'national_id', expiresAt: 'not-a-date' },
        stored,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a future expiry date', async () => {
    requirements.findOne.mockResolvedValue(requirement());
    documents.find.mockResolvedValue([]);
    documents.create.mockImplementation((x) => x);
    documents.save.mockImplementation(async (x) => x);

    const saved = await service.submitUpload(
      'user-1',
      { requirementCode: 'national_id', expiresAt: '2031-01-31' },
      stored,
    );
    expect(saved.expiresAt).toBeInstanceOf(Date);
  });

  it('includes seller-audience requirements for an account that sells', async () => {
    sellers.exists.mockResolvedValue(true);
    requirements.find.mockResolvedValue([]);

    await service.checklistFor('user-1');

    const where = requirements.find.mock.calls[0][0].where;
    // The first branch must union buyer AND seller audiences.
    const audiences = where[0].audience as { _value?: string[] } | string[];
    const values = Array.isArray(audiences) ? audiences : audiences._value;
    expect(values).toEqual(
      expect.arrayContaining([KycRequirementAudience.BUYER, KycRequirementAudience.SELLER]),
    );
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
