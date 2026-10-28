import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';

import { Admin, AdminRole } from '../admin/entities/admin.entity';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '../audit/entities/audit-log.entity';
import { generateSecret, otpauthUrl, verifyTotp } from './totp';
import { RoleMfaPolicyDto, UpdateMfaPolicyDto } from './dto/mfa.dto';

/** Five wrong codes locks the account out; the lock is short and it is logged. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RECOVERY_CODE_COUNT = 10;
const CHALLENGE_TTL = '10m';

export interface MfaPolicy {
  /** Master switch. When false no role is challenged. */
  required: boolean;
  roles: Record<AdminRole, { required: boolean; stepUpMinutes: number }>;
}

export interface MfaRequirement {
  required: boolean;
  stepUpMinutes: number;
}

/**
 * Two-factor authentication for administrators.
 *
 * The design is tiered rather than flat, because not every administrative act
 * carries the same risk:
 *
 *   - **Sign-in (assurance level 2).** Every administrator proves a second
 *     factor to obtain a session. There is no window in which an admin routes
 *     around this: the login response carries a challenge, not a token.
 *   - **Step-up.** Actions that move money or change a person's standing
 *     (refunding escrow, creditng a wallet, suspending an account, changing the
 *     MFA policy itself) require a *recent* proof — 5 minutes for the roles that
 *     can do the most damage, up to 15 for the least. A long-lived session is
 *     therefore not a long-lived licence to move money.
 *   - **Recovery.** Single-use recovery codes, stored only as hashes, so a lost
 *     phone is an inconvenience rather than a lockout — with a super admin's
 *     oversight of who is enrolled.
 *
 * All of it is configurable by a super admin, because the requirement is a
 * policy decision, but the defaults are safe and cannot be switched off by
 * anyone who has not themselves passed MFA.
 */
@Injectable()
export class AdminMfaService {
  private readonly logger = new Logger(AdminMfaService.name);

  constructor(
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    private readonly settings: SettingsService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  // ─── Policy ─────────────────────────────────────────────────────

  private static readonly DEFAULT_POLICY: MfaPolicy = {
    required: true,
    roles: {
      // The more a role can do, the shorter its proof lasts.
      [AdminRole.SUPER_ADMIN]: { required: true, stepUpMinutes: 5 },
      [AdminRole.PLATFORM_ADMIN]: { required: true, stepUpMinutes: 10 },
      [AdminRole.FINANCE_ADMIN]: { required: true, stepUpMinutes: 5 },
      [AdminRole.SUPPORT_ADMIN]: { required: true, stepUpMinutes: 15 },
    },
  };

  /**
   * The stored policy, merged over the defaults so a role added later is
   * covered without a migration.
   */
  async policy(): Promise<MfaPolicy> {
    const stored = (await this.settings.get('mfaPolicy')) ?? {};
    const roles = { ...AdminMfaService.DEFAULT_POLICY.roles };
    const storedRoles = (stored.roles ?? {}) as Record<string, RoleMfaPolicyDto>;
    for (const role of Object.values(AdminRole)) {
      const entry = storedRoles[role];
      if (!entry) continue;
      roles[role] = {
        required: entry.required !== false,
        stepUpMinutes:
          Number.isFinite(Number(entry.stepUpMinutes)) && Number(entry.stepUpMinutes) > 0
            ? Math.min(Number(entry.stepUpMinutes), 120)
            : roles[role].stepUpMinutes,
      };
    }
    return { required: stored.required !== false, roles };
  }

  /** What this particular administrator must satisfy. */
  async requirementFor(admin: Pick<Admin, 'role'>): Promise<MfaRequirement> {
    const policy = await this.policy();
    const rolePolicy = policy.roles[admin.role] ?? { required: true, stepUpMinutes: 10 };
    return {
      // An admin who enrolled voluntarily still gets challenged: turning the
      // policy off must not silently undo an individual's own protection.
      required: rolePolicy.required && policy.required,
      stepUpMinutes: rolePolicy.stepUpMinutes,
    };
  }

  async updatePolicy(input: UpdateMfaPolicyDto, actor: Admin): Promise<MfaPolicy> {
    const current = await this.policy();

    if (input.required === false && process.env.NODE_ENV === 'production' && !process.env.MFA_ALLOW_DISABLE) {
      throw new BadRequestException(
        'Two-factor authentication for administrators cannot be switched off in production. ' +
          'Set MFA_ALLOW_DISABLE only for a deliberate, temporary exception.',
      );
    }

    const roles = { ...current.roles };
    for (const [role, entry] of Object.entries(input.roles ?? {})) {
      if (!(role in current.roles)) {
        throw new BadRequestException(`Unknown admin role "${role}"`);
      }
      roles[role as AdminRole] = {
        required: entry.required !== false,
        stepUpMinutes: Math.min(Math.max(Number(entry.stepUpMinutes) || 10, 1), 120),
      };
    }

    const next: MfaPolicy = {
      required: input.required ?? current.required,
      roles,
    };
    await this.settings.set('mfaPolicy', next);

    void this.audit
      .logAction(
        actor.id,
        AuditAction.PERMISSION_CHANGE,
        AuditEntityType.ADMIN,
        actor.id,
        { old: current as any, new: next as any },
        { event: 'mfa_policy_updated' },
      )
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return next;
  }

  // ─── Sign-in gate ───────────────────────────────────────────────

  /**
   * Whether this account must prove a second factor before it gets a session.
   * Returns null for accounts that are not administrators at all.
   */
  async gateForUser(
    userId: string,
  ): Promise<{ mfaRequired: boolean; enrolmentRequired: boolean } | null> {
    const admin = await this.adminRepo.findOne({ where: { userId } });
    if (!admin || !admin.isActive) return null;

    const requirement = await this.requirementFor(admin);
    const mfaRequired = requirement.required || admin.mfaEnabled;
    if (!mfaRequired) return null;

    return { mfaRequired: true, enrolmentRequired: !admin.mfaEnabled };
  }

  // ─── Enrolment ──────────────────────────────────────────────────

  /**
   * Start enrolment: mint a secret and hand back the otpauth URI for the app's
   * QR code, plus the recovery codes.
   *
   * The codes are issued here rather than at confirmation because enrolment
   * happens *before* there is a session (an administrator cannot sign in
   * without a second factor), so this is the only moment they can be shown.
   * Only hashes are stored, and nothing is armed until a code from the new
   * secret is verified.
   */
  async beginEnrolment(
    userId: string,
  ): Promise<{ secret: string; otpauthUrl: string; recoveryCodes: string[] }> {
    const admin = await this.requireAdmin(userId);
    if (admin.mfaEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already set up on this account. Sign in with your code instead.',
      );
    }

    const secret = generateSecret();
    const { codes, stored } = this.generateRecoveryCodes();
    admin.mfaSecret = this.encrypt(secret);
    admin.mfaRecoveryCodes = stored;
    // Not enabled yet — confirmEnrolment is what arms it.
    await this.adminRepo.save(admin);

    return {
      secret,
      otpauthUrl: otpauthUrl({ secret, account: admin.email, issuer: 'GreyAuction' }),
      recoveryCodes: codes,
    };
  }

  /**
   * Finish enrolment. The submitted code proves the authenticator really holds
   * the secret; only then is MFA armed.
   */
  async confirmEnrolment(userId: string, code: string): Promise<{ enabled: true }> {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaSecret) {
      throw new BadRequestException('Start the setup again — no pending secret was found.');
    }
    if (admin.mfaEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled.');
    }

    const secret = this.decrypt(admin.mfaSecret);
    const check = verifyTotp(secret, code, Date.now());
    if (!check.valid) {
      throw new BadRequestException(
        'That code did not match. Check the time on your phone and try the current code.',
      );
    }

    this.arm(admin, check.counter);
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(admin.id, AuditAction.VERIFY, AuditEntityType.ADMIN, admin.id, undefined, {
        event: 'mfa_enrolled',
        recoveryCodesIssued: (admin.mfaRecoveryCodes ?? []).length,
      })
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return { enabled: true };
  }

  // ─── Verification ───────────────────────────────────────────────

  /**
   * Verify a 6-digit code, or a recovery code when `allowRecovery` is set.
   * A success refreshes `lastMfaAt`, which is what the step-up guard reads.
   */
  async verifySecondFactor(
    userId: string,
    rawCode: string,
    options: { allowRecovery?: boolean; allowPendingEnrolment?: boolean } = {},
  ): Promise<{ method: 'totp' | 'recovery'; stepUpMinutes: number }> {
    const admin = await this.requireAdmin(userId);

    /**
     * A pending secret (enrolment started, never confirmed) is completed by the
     * first valid code from it. This is the sign-in path for a brand-new
     * administrator: there is no session yet to post a confirmation to.
     */
    if (!admin.mfaEnabled && admin.mfaSecret && options.allowPendingEnrolment) {
      const secret = this.decrypt(admin.mfaSecret);
      const check = verifyTotp(secret, rawCode, Date.now());
      if (!check.valid) {
        await this.registerFailedAttempt(admin, check.reason ?? 'mismatch');
        throw new UnauthorizedException('That code is not correct.');
      }
      this.arm(admin, check.counter);
      await this.adminRepo.save(admin);

      void this.audit
        .logAction(admin.id, AuditAction.VERIFY, AuditEntityType.ADMIN, admin.id, undefined, {
          event: 'mfa_enrolled_at_sign_in',
        })
        .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

      const requirement = await this.requirementFor(admin);
      return { method: 'totp', stepUpMinutes: requirement.stepUpMinutes };
    }

    if (!admin.mfaEnabled || !admin.mfaSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled for this account.');
    }

    if (admin.mfaLockedUntil && admin.mfaLockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((admin.mfaLockedUntil.getTime() - Date.now()) / 60_000);
      throw new ForbiddenException(
        `Too many incorrect codes. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or use a recovery code.`,
      );
    }

    const code = String(rawCode ?? '').trim();
    const recovery = options.allowRecovery ? this.tryRecoveryCode(admin, code) : null;

    if (!recovery) {
      const secret = this.decrypt(admin.mfaSecret);
      const minStep = Number(admin.mfaLastStep ?? 0);
      const check = verifyTotp(secret, code, Date.now(), minStep);
      if (!check.valid) {
        await this.registerFailedAttempt(admin, check.reason);
        throw new UnauthorizedException(
          check.reason === 'replay'
            ? 'That code has already been used. Wait for the next one.'
            : 'That code is not correct.',
        );
      }
      admin.mfaLastStep = String(check.counter);
      await this.recordSuccess(admin);
      const requirement = await this.requirementFor(admin);
      return { method: 'totp', stepUpMinutes: requirement.stepUpMinutes };
    }

    await this.recordSuccess(admin);
    const requirement = await this.requirementFor(admin);
    return { method: 'recovery', stepUpMinutes: requirement.stepUpMinutes };
  }

  /**
   * Re-prove a second factor for a consequential action. Thin wrapper over
   * `verifySecondFactor` so call sites read as what they are.
   */
  async stepUp(userId: string, code: string): Promise<{ expiresAt: Date }> {
    const requirement = await this.requirementFor(await this.requireAdmin(userId));
    await this.verifySecondFactor(userId, code, { allowRecovery: true });
    const expiresAt = new Date(Date.now() + requirement.stepUpMinutes * 60_000);
    return { expiresAt };
  }

  // ─── Status and management ──────────────────────────────────────

  async statusFor(userId: string) {
    const admin = await this.requireAdmin(userId);
    const requirement = await this.requirementFor(admin);
    const lastProof = admin.lastMfaAt?.getTime() ?? 0;
    const stepUpExpiresAt = lastProof
      ? new Date(lastProof + requirement.stepUpMinutes * 60_000)
      : null;

    return {
      enabled: admin.mfaEnabled,
      enrolledAt: admin.mfaEnrolledAt,
      role: admin.role,
      policy: requirement,
      lastVerifiedAt: admin.lastMfaAt,
      stepUpExpiresAt,
      stepUpValid: !!stepUpExpiresAt && stepUpExpiresAt.getTime() > Date.now(),
      lockedUntil: admin.mfaLockedUntil,
      recoveryCodesRemaining: (admin.mfaRecoveryCodes ?? []).filter((c) => !c.usedAt).length,
    };
  }

  /** A super admin's view: who is enrolled, who is not, who is locked out. */
  async overview() {
    const admins = await this.adminRepo.find({ order: { createdAt: 'ASC' } });
    const policy = await this.policy();
    return {
      policy,
      admins: admins.map((admin) => {
        const rolePolicy = policy.roles[admin.role];
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isActive: admin.isActive,
          mfaEnabled: admin.mfaEnabled,
          enrolledAt: admin.mfaEnrolledAt,
          lastMfaAt: admin.lastMfaAt,
          lockedUntil: admin.mfaLockedUntil,
          recoveryCodesRemaining: (admin.mfaRecoveryCodes ?? []).filter((c) => !c.usedAt).length,
          // The point of the overview: who can currently sign in without a
          // second factor, and whether policy allows that.
          requiresMfa: policy.required && (rolePolicy?.required ?? true),
        };
      }),
    };
  }

  /**
   * Turn MFA off for an account. Refused when policy requires it — otherwise
   * the requirement would be self-cancelling.
   */
  async disable(userId: string, code: string, actor?: Admin): Promise<{ enabled: false }> {
    const admin = await this.requireAdmin(userId);
    const requirement = await this.requirementFor(admin);
    if (requirement.required) {
      throw new ForbiddenException(
        'Two-factor authentication is required for this role and cannot be switched off.',
      );
    }
    await this.verifySecondFactor(userId, code);
    admin.mfaEnabled = false;
    admin.mfaSecret = null;
    admin.mfaRecoveryCodes = [];
    admin.mfaEnrolledAt = null;
    admin.mfaLastStep = null;
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(
        actor?.id ?? admin.id,
        AuditAction.UPDATE,
        AuditEntityType.ADMIN,
        admin.id,
        { old: { mfaEnabled: true }, new: { mfaEnabled: false } },
        { event: 'mfa_disabled' },
      )
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return { enabled: false };
  }

  /** New recovery codes; the old ones stop working immediately. */
  async regenerateRecoveryCodes(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const admin = await this.requireAdmin(userId);
    await this.verifySecondFactor(userId, code);
    const { codes, stored } = this.generateRecoveryCodes();
    admin.mfaRecoveryCodes = stored;
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(admin.id, AuditAction.UPDATE, AuditEntityType.ADMIN, admin.id, undefined, {
        event: 'mfa_recovery_codes_regenerated',
      })
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return { recoveryCodes: codes };
  }

  /** Clear a lockout. A super admin may do it; so may the admin with a good code. */
  async clearLockout(adminId: string, actor: Admin): Promise<{ cleared: true }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Administrator not found');
    admin.mfaFailedAttempts = 0;
    admin.mfaLockedUntil = null;
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(actor.id, AuditAction.UPDATE, AuditEntityType.ADMIN, admin.id, undefined, {
        event: 'mfa_lockout_cleared',
      })
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return { cleared: true };
  }

  /**
   * Reset another administrator's second factor.
   *
   * The operational escape hatch: a lost phone AND lost recovery codes leaves
   * no way in, and without this the only remedy is a database edit — unattributed
   * and unaudited. The account can then enrol again at its next sign-in, so the
   * reset hands back access without handing back the old secret.
   *
   * A super admin cannot reset themselves: the whole point is that this route is
   * opened by a *different* person who can be held to it.
   */
  async resetEnrolment(adminId: string, actor: Admin): Promise<{ reset: true }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Administrator not found');
    if (admin.id === actor.id) {
      throw new ForbiddenException(
        'You cannot reset your own second factor. Ask another super admin to do it.',
      );
    }

    admin.mfaEnabled = false;
    admin.mfaSecret = null;
    admin.mfaRecoveryCodes = [];
    admin.mfaEnrolledAt = null;
    admin.mfaLastStep = null;
    admin.mfaFailedAttempts = 0;
    admin.mfaLockedUntil = null;
    admin.lastMfaAt = null;
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(
        actor.id,
        AuditAction.PERMISSION_CHANGE,
        AuditEntityType.ADMIN,
        admin.id,
        { old: { mfaEnabled: true }, new: { mfaEnabled: false } },
        { event: 'mfa_reset_by_super_admin', target: admin.email },
      )
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));

    return { reset: true };
  }

  /**
   * Whether this admin has proved a second factor recently enough for a
   * consequential action. Read by StepUpGuard.
   */
  async stepUpIsValid(admin: Admin): Promise<{ valid: boolean; expiresAt: Date | null; window: number }> {
    const requirement = await this.requirementFor(admin);
    if (!requirement.required && !admin.mfaEnabled) {
      return { valid: true, expiresAt: null, window: requirement.stepUpMinutes };
    }
    const last = admin.lastMfaAt?.getTime() ?? 0;
    if (!last) return { valid: false, expiresAt: null, window: requirement.stepUpMinutes };
    const expiresAt = new Date(last + requirement.stepUpMinutes * 60_000);
    return {
      valid: expiresAt.getTime() > Date.now(),
      expiresAt,
      window: requirement.stepUpMinutes,
    };
  }

  // ─── Internals ──────────────────────────────────────────────────

  private async requireAdmin(userId: string): Promise<Admin> {
    const admin = await this.adminRepo.findOne({ where: { userId } });
    if (!admin) throw new NotFoundException('Administrator not found');
    if (!admin.isActive) throw new ForbiddenException('Administrator account is deactivated');
    return admin;
  }

  /** Arm the second factor and record the proof that armed it. */
  private arm(admin: Admin, counter: number): void {
    admin.mfaEnabled = true;
    admin.mfaEnrolledAt = new Date();
    admin.mfaLastStep = String(counter);
    admin.mfaFailedAttempts = 0;
    admin.mfaLockedUntil = null;
    admin.lastMfaAt = new Date();
  }

  private async recordSuccess(admin: Admin): Promise<void> {
    admin.mfaFailedAttempts = 0;
    admin.mfaLockedUntil = null;
    admin.lastMfaAt = new Date();
    await this.adminRepo.save(admin);
  }

  private async registerFailedAttempt(admin: Admin, reason: string): Promise<void> {
    admin.mfaFailedAttempts = (admin.mfaFailedAttempts ?? 0) + 1;
    if (admin.mfaFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.mfaLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
      admin.mfaFailedAttempts = 0;
      this.logger.warn(
        `Admin ${admin.email} locked out for ${LOCKOUT_MINUTES} minutes after ${MAX_FAILED_ATTEMPTS} failed second-factor attempts`,
      );
    }
    await this.adminRepo.save(admin);

    void this.audit
      .logAction(admin.id, AuditAction.LOGIN, AuditEntityType.ADMIN, admin.id, undefined, {
        event: 'mfa_failed',
        reason,
        locked: !!admin.mfaLockedUntil,
      })
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));
  }

  private generateRecoveryCodes(): {
    codes: string[];
    stored: Array<{ hash: string; usedAt: string | null }>;
  } {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes: string[] = [];
    const stored: Array<{ hash: string; usedAt: string | null }> = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
      let raw = '';
      for (let j = 0; j < 8; j += 1) raw += alphabet[randomInt(alphabet.length)];
      const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
      codes.push(code);
      stored.push({ hash: this.hashRecoveryCode(code), usedAt: null });
    }
    return { codes, stored };
  }

  private hashRecoveryCode(code: string): string {
    return createHash('sha256')
      .update(code.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .digest('hex');
  }

  /** Marks the matching recovery code used, or returns null. */
  private tryRecoveryCode(admin: Admin, code: string): { ok: true } | null {
    const normalised = this.hashRecoveryCode(code);
    if (normalised.length !== 64) return null;
    const entries = admin.mfaRecoveryCodes ?? [];
    let matchedIndex = -1;
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry.usedAt) continue;
      const stored = Buffer.from(entry.hash, 'hex');
      const submitted = Buffer.from(normalised, 'hex');
      if (stored.length === submitted.length && timingSafeEqual(stored, submitted)) {
        matchedIndex = i;
        break;
      }
    }
    if (matchedIndex === -1) return null;

    entries[matchedIndex] = { ...entries[matchedIndex], usedAt: new Date().toISOString() };
    admin.mfaRecoveryCodes = entries;
    void this.audit
      .logAction(admin.id, AuditAction.LOGIN, AuditEntityType.ADMIN, admin.id, undefined, {
        event: 'mfa_recovery_code_used',
        remaining: entries.filter((entry) => !entry.usedAt).length,
      })
      .catch((error) => this.logger.warn(`Audit write failed: ${error.message}`));
    return { ok: true };
  }

  /**
   * AES-256-GCM. The key comes from ADMIN_MFA_KEY when set; otherwise it is
   * derived from JWT_SECRET, so a deployment without the extra variable is
   * still not storing secrets in the clear. A dedicated key is better: rotating
   * JWT_SECRET should not invalidate every admin's authenticator.
   */
  private encryptionKey(): Buffer {
    const explicit = process.env.ADMIN_MFA_KEY;
    if (explicit) {
      const buffer = /^[0-9a-f]{64}$/i.test(explicit)
        ? Buffer.from(explicit, 'hex')
        : Buffer.from(explicit, 'base64');
      if (buffer.length !== 32) {
        throw new Error('ADMIN_MFA_KEY must be 32 bytes (64 hex characters or base64)');
      }
      return buffer;
    }
    return createHash('sha256')
      .update(`${process.env.JWT_SECRET || 'dev-secret'}:admin-mfa:v1`)
      .digest();
  }

  private encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.');
  }

  private decrypt(payload: string): string {
    const [version, iv, tag, ciphertext] = String(payload).split('.');
    if (version !== 'v1' || !iv || !tag || !ciphertext) {
      throw new BadRequestException(
        'The stored authenticator secret could not be read. An administrator must reset your two-factor authentication.',
      );
    }
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(iv, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      // Wrong key (JWT_SECRET rotated without ADMIN_MFA_KEY) or tampering.
      throw new BadRequestException(
        'The stored authenticator secret could not be read. An administrator must reset your two-factor authentication.',
      );
    }
  }
}
