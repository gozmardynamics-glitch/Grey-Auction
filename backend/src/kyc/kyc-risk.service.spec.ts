import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { KycRiskService } from './kyc-risk.service';
import {
  KycDocumentRequirement,
  KycRequirementAudience,
} from './entities/kyc-document-requirement.entity';
import { KycDocument, KycDocumentStatus } from './entities/kyc-document.entity';
import { User } from '../auth/entities/user.entity';
import { Seller, SellerVerificationStatus } from '../seller/entities/seller.entity';

describe('KycRiskService', () => {
  let service: KycRiskService;

  const requirements = { find: jest.fn() };
  const documents = { find: jest.fn() };
  const users = { findOne: jest.fn() };
  const sellers = { findOne: jest.fn() };

  const req = (over: Partial<KycDocumentRequirement> = {}) =>
    ({
      id: 'req-1',
      code: 'national_id',
      name: 'National ID Card',
      isRequired: true,
      isActive: true,
      audience: KycRequirementAudience.BUYER,
      sortOrder: 0,
      ...over,
    }) as KycDocumentRequirement;

  const doc = (over: Partial<KycDocument> = {}) =>
    ({
      id: 'doc-1',
      userId: 'user-1',
      requirementId: 'req-1',
      status: KycDocumentStatus.APPROVED,
      reviewNotes: null,
      expiresAt: null,
      createdAt: new Date('2026-01-02'),
      ...over,
    }) as KycDocument;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycRiskService,
        { provide: getRepositoryToken(KycDocumentRequirement), useValue: requirements },
        { provide: getRepositoryToken(KycDocument), useValue: documents },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Seller), useValue: sellers },
      ],
    }).compile();
    service = module.get<KycRiskService>(KycRiskService);
  });

  // ── Scoring and banding ────────────────────────────────────────────────

  it('scores 100 and low risk when every required document is approved', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc()]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.complianceScore).toBe(100);
    expect(report.band).toBe('low');
    expect(report.eligibleToPublish).toBe(true);
    expect(report.recommendation).toBe('approve');
  });

  it('scores 0 and high risk when nothing was submitted', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.complianceScore).toBe(0);
    expect(report.band).toBe('high');
    expect(report.eligibleToPublish).toBe(false);
    expect(report.recommendation).toBe('withhold');
    expect(report.signals).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'missing_document' })]),
    );
  });

  it('treats a pending document as a warning, not an approval', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc({ status: KycDocumentStatus.PENDING })]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.complianceScore).toBe(0);
    expect(report.requiredApproved).toBe(0);
    expect(report.signals).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'pending_document' })]),
    );
  });

  it('a rejected document blocks publishing and carries the reviewer note', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([
      doc({ status: KycDocumentStatus.REJECTED, reviewNotes: 'Expiry not visible' }),
    ]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.eligibleToPublish).toBe(false);
    expect(report.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'rejected_document',
          detail: expect.stringContaining('Expiry not visible'),
        }),
      ]),
    );
  });

  it('an expired approved document is critical even though it was approved', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([
      doc({ expiresAt: new Date('2020-01-01') }),
    ]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.eligibleToPublish).toBe(false);
    expect(report.signals).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'expired_document' })]),
    );
  });

  it('uses the newest submission when a requirement was re-uploaded', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([
      doc({ id: 'newer', status: KycDocumentStatus.APPROVED, createdAt: new Date('2026-02-01') }),
      doc({ id: 'older', status: KycDocumentStatus.REJECTED, createdAt: new Date('2026-01-01') }),
    ]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.requiredApproved).toBe(1);
    expect(report.band).toBe('low');
  });

  it('an unverified email caps the band at medium so a human reviews it', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc()]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: false, isActive: true });

    const report = await service.assess('user-1');

    expect(report.complianceScore).toBe(100);
    // A warning can never leave a seller in the low-risk band.
    expect(report.band).toBe('medium');
    expect(report.recommendation).toBe('review');
    expect(report.signals).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'email_unverified' })]),
    );
  });

  it('optional documents add half weight and cannot alone make a seller low risk', async () => {
    requirements.find.mockResolvedValue([
      req({ id: 'req-1', isRequired: true }),
      req({ id: 'req-2', code: 'extra', isRequired: false }),
    ]);
    documents.find.mockResolvedValue([doc({ requirementId: 'req-2' })]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    // required 0/1 + optional 0.5/1 → 0.5/1.5 = 33%
    expect(report.complianceScore).toBe(33);
    expect(report.eligibleToPublish).toBe(false);
  });

  it('with no requirements configured, scoring reports 100 but publishing stays blocked', async () => {
    requirements.find.mockResolvedValue([]);
    documents.find.mockResolvedValue([]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });

    const report = await service.assess('user-1');

    expect(report.complianceScore).toBe(100);
    expect(report.eligibleToPublish).toBe(false); // nothing was actually verified
    expect(report.recommendation).toBe('withhold');
  });

  // ── Publishing gate ───────────────────────────────────────────────────

  it('allows publishing only when KYC approved, score passes, and admin consented', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc()]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue({
      user_id: 'user-1',
      verification_status: SellerVerificationStatus.APPROVED,
      publish_approved: true,
    });

    const gate = await service.canPublish('user-1');
    expect(gate.allowed).toBe(true);
  });

  it('blocks publishing when the admin has withheld consent even at a perfect score', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc()]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue({
      user_id: 'user-1',
      verification_status: SellerVerificationStatus.APPROVED,
      publish_approved: false,
    });

    const gate = await service.canPublish('user-1');
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toContain('Awaiting admin approval');
  });

  it('admin consent cannot override missing KYC documents', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue({
      user_id: 'user-1',
      verification_status: SellerVerificationStatus.APPROVED,
      publish_approved: true, // admin said yes, but KYC is incomplete
    });

    const gate = await service.canPublish('user-1');
    expect(gate.allowed).toBe(false);
  });

  it('names the missing documents rather than quoting the score', async () => {
    // Regression: a seller with verification APPROVED and consent granted but no
    // approved documents was told "compliance score 0% (high risk)", which points
    // the admin at the score instead of the documents that actually block it.
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([]); // nothing uploaded
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue({
      user_id: 'user-1',
      verification_status: SellerVerificationStatus.APPROVED,
      publish_approved: true,
    });

    const gate = await service.canPublish('user-1');

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toMatch(/1 of 1 required KYC document/i);
    expect(gate.reason).not.toMatch(/compliance score/i);
  });

  it('says so when no requirements are configured to score against', async () => {
    requirements.find.mockResolvedValue([]);
    documents.find.mockResolvedValue([]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue({
      user_id: 'user-1',
      verification_status: SellerVerificationStatus.APPROVED,
      publish_approved: true,
    });

    const gate = await service.canPublish('user-1');

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toMatch(/no KYC requirements are configured/i);
  });

  it('blocks publishing when there is no seller profile at all', async () => {
    requirements.find.mockResolvedValue([req()]);
    documents.find.mockResolvedValue([doc()]);
    users.findOne.mockResolvedValue({ id: 'user-1', isEmailVerified: true, isActive: true });
    sellers.findOne.mockResolvedValue(null);

    const gate = await service.canPublish('user-1');
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toContain('No seller profile');
  });
});
