import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Seller, SellerVerificationStatus } from '../seller/entities/seller.entity';
import {
  KycDocumentRequirement,
  KycRequirementAudience,
} from './entities/kyc-document-requirement.entity';
import { KycDocument, KycDocumentStatus } from './entities/kyc-document.entity';

export type KycRiskBand = 'low' | 'medium' | 'high';

export interface KycRiskSignal {
  code: string;
  /** How much this signal should worry a reviewer. */
  severity: 'info' | 'warn' | 'critical';
  detail: string;
}

export interface KycRiskReport {
  userId: string;
  /** 0-100. Weighted share of required documents that are approved. */
  complianceScore: number;
  band: KycRiskBand;
  requiredTotal: number;
  requiredApproved: number;
  optionalTotal: number;
  optionalApproved: number;
  signals: KycRiskSignal[];
  /** Advisory only — the admin makes the publish decision. */
  recommendation: 'approve' | 'review' | 'withhold';
  /** True when nothing is blocking publishing on KYC grounds. */
  eligibleToPublish: boolean;
}

/**
 * Seller-risk assessment used to decide whether a lot may go public.
 *
 * The brief: a seller may create listings, but a lot cannot become public until
 * KYC passes; an admin decides based on the evaluation. This produces the
 * evaluation — a weighted compliance score plus independent risk signals — and
 * leaves the decision with the admin.
 *
 * Scoring: required documents carry the full weight; optional ones count for half
 * and can never lift a seller above "medium" on their own, because they are not
 * what the platform asked for.
 */
@Injectable()
export class KycRiskService {
  /** Below this the platform withholds publishing regardless of admin intent. */
  static readonly MINIMUM_PUBLISH_SCORE = 60;
  /** At or above this, the seller is low risk. */
  static readonly LOW_RISK_SCORE = 90;

  constructor(
    @InjectRepository(KycDocumentRequirement)
    private readonly requirements: Repository<KycDocumentRequirement>,
    @InjectRepository(KycDocument)
    private readonly documents: Repository<KycDocument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Seller)
    private readonly sellers: Repository<Seller>,
  ) {}

  /** Requirements that apply to an account holder who both bids and sells. */
  private async applicableRequirements(): Promise<KycDocumentRequirement[]> {
    return this.requirements.find({
      where: [
        { isActive: true, audience: KycRequirementAudience.BUYER },
        { isActive: true, audience: KycRequirementAudience.SELLER },
        { isActive: true, audience: KycRequirementAudience.BOTH },
      ],
      order: { sortOrder: 'ASC' },
    });
  }

  async assess(userId: string): Promise<KycRiskReport> {
    const [requirements, documents, user] = await Promise.all([
      this.applicableRequirements(),
      this.documents.find({ where: { userId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    // Latest document wins per requirement, matching the holder-facing checklist.
    const latest = new Map<string, KycDocument>();
    for (const doc of [...documents].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )) {
      if (!latest.has(doc.requirementId)) latest.set(doc.requirementId, doc);
    }

    const required = requirements.filter((r) => r.isRequired);
    const optional = requirements.filter((r) => !r.isRequired);

    const approvedCount = (list: KycDocumentRequirement[]) =>
      list.filter(
        (r) => latest.get(r.id)?.status === KycDocumentStatus.APPROVED,
      ).length;

    const requiredApproved = approvedCount(required);
    const optionalApproved = approvedCount(optional);

    // Required documents dominate; optional ones contribute half weight each.
    const maxScore = required.length + optional.length * 0.5;
    const earnedScore = requiredApproved + optionalApproved * 0.5;
    const complianceScore =
      maxScore === 0 ? 100 : Math.round((earnedScore / maxScore) * 100);

    const signals: KycRiskSignal[] = [];

    if (maxScore === 0) {
      signals.push({
        code: 'no_requirements',
        severity: 'warn',
        detail:
          'No KYC documents are configured, so this seller has not been assessed on anything.',
      });
    }

    for (const requirement of required) {
      const doc = latest.get(requirement.id);
      if (!doc) {
        signals.push({
          code: 'missing_document',
          severity: 'critical',
          detail: `Required document not submitted: ${requirement.name}`,
        });
      } else if (doc.status === KycDocumentStatus.REJECTED) {
        signals.push({
          code: 'rejected_document',
          severity: 'critical',
          detail: `${requirement.name} was rejected${doc.reviewNotes ? `: ${doc.reviewNotes}` : ''}`,
        });
      } else if (doc.status === KycDocumentStatus.PENDING) {
        signals.push({
          code: 'pending_document',
          severity: 'warn',
          detail: `${requirement.name} is still awaiting review`,
        });
      }
    }

    // An expired document is a critical signal regardless of its review status —
    // the holder was verified on something that is no longer valid.
    const now = Date.now();
    for (const [requirementId, doc] of latest) {
      if (!doc.expiresAt) continue;
      if (new Date(doc.expiresAt).getTime() >= now) continue;
      const requirement = requirements.find((r) => r.id === requirementId);
      signals.push({
        code: 'expired_document',
        severity: 'critical',
        detail: `${requirement?.name ?? 'A document'} expired on ${new Date(doc.expiresAt).toISOString().slice(0, 10)}`,
      });
    }

    if (user && !user.isEmailVerified) {
      signals.push({
        code: 'email_unverified',
        severity: 'warn',
        detail: 'Account email has not been verified',
      });
    }

    if (user && !user.isActive) {
      signals.push({
        code: 'account_inactive',
        severity: 'critical',
        detail: 'Account is not active',
      });
    }

    const hasCritical = signals.some((s) => s.severity === 'critical');
    const hasWarn = signals.some((s) => s.severity === 'warn');

    // A warning can never leave a seller in the low-risk band: something needs a
    // human to look, so the best they can score is "medium". A critical signal
    // drops them to "high" outright.
    const band: KycRiskBand = hasCritical
      ? 'high'
      : complianceScore >= KycRiskService.LOW_RISK_SCORE && !hasWarn
        ? 'low'
        : complianceScore >= KycRiskService.MINIMUM_PUBLISH_SCORE
          ? 'medium'
          : 'high';

    const eligibleToPublish =
      maxScore > 0 &&
      requiredApproved === required.length &&
      complianceScore >= KycRiskService.MINIMUM_PUBLISH_SCORE &&
      !hasCritical;

    // Recommendation follows eligibility, not the band: a seller can reach a
    // "low" band simply because nothing was configured, and that must never read
    // as an approval.
    const recommendation: KycRiskReport['recommendation'] = !eligibleToPublish
      ? 'withhold'
      : band === 'low'
        ? 'approve'
        : 'review';

    return {
      userId,
      complianceScore,
      band,
      requiredTotal: required.length,
      requiredApproved,
      optionalTotal: optional.length,
      optionalApproved,
      signals,
      recommendation,
      eligibleToPublish,
    };
  }

  /**
   * The publishing gate: may this account holder make a lot public?
   *
   * Enforces the agreed policy — a seller can create listings freely, but a lot
   * only goes public when KYC has actually passed *and* an admin has approved
   * publishing. Both halves are required: KYC approval alone is not consent to
   * publish, and admin consent cannot override missing documents.
   */
  async canPublish(userId: string): Promise<{
    allowed: boolean;
    reason: string;
    report: KycRiskReport;
    publishApproved: boolean;
    verificationStatus: string | null;
  }> {
    const report = await this.assess(userId);
    const seller = await this.sellers.findOne({ where: { user_id: userId } });
    const publishApproved = seller?.publish_approved === true;
    const verificationStatus = seller?.verification_status ?? null;

    if (!seller) {
      return {
        allowed: false,
        reason: 'No seller profile — complete seller onboarding first',
        report,
        publishApproved,
        verificationStatus,
      };
    }
    if (verificationStatus !== SellerVerificationStatus.APPROVED) {
      return {
        allowed: false,
        reason: `KYC is not approved (status: ${verificationStatus})`,
        report,
        publishApproved,
        verificationStatus,
      };
    }
    if (!report.eligibleToPublish) {
      // Say which condition actually failed. Quoting the score for a missing
      // document sends an admin to the wrong screen: the score is 0 because
      // nothing is approved yet, and approving documents is what fixes it.
      const outstanding = report.requiredTotal - report.requiredApproved;
      const critical = report.signals.filter((signal) => signal.severity === 'critical');
      const reason =
        report.requiredTotal === 0
          ? 'No KYC requirements are configured, so compliance cannot be established'
          : outstanding > 0
            ? `${outstanding} of ${report.requiredTotal} required KYC document(s) still need approval`
            : critical.length
              ? `Blocking compliance signal: ${critical[0].detail}`
              : `KYC compliance score ${report.complianceScore}% (${report.band} risk) is below the publishing threshold of ${KycRiskService.MINIMUM_PUBLISH_SCORE}%`;

      return {
        allowed: false,
        reason,
        report,
        publishApproved,
        verificationStatus,
      };
    }
    if (!publishApproved) {
      return {
        allowed: false,
        reason: 'Awaiting admin approval to publish',
        report,
        publishApproved,
        verificationStatus,
      };
    }

    return {
      allowed: true,
      reason: 'KYC approved and publishing authorised',
      report,
      publishApproved,
      verificationStatus,
    };
  }

  /** Convenience for callers that only need the boolean. */
  async isPublishAllowed(userId: string): Promise<boolean> {
    return (await this.canPublish(userId)).allowed;
  }

  /** Requirement codes still outstanding for a user (used in admin messaging). */  async outstandingCodes(userId: string): Promise<string[]> {
    const [requirements, documents] = await Promise.all([
      this.applicableRequirements(),
      this.documents.find({ where: { userId } }),
    ]);
    const approved = new Set(
      documents
        .filter((d) => d.status === KycDocumentStatus.APPROVED)
        .map((d) => d.requirementId),
    );
    return requirements
      .filter((r) => r.isRequired && !approved.has(r.id))
      .map((r) => r.code);
  }
}
