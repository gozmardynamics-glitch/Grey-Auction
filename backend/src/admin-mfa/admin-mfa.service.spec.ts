import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { AdminMfaService } from './admin-mfa.service';
import { Admin, AdminRole } from '../admin/entities/admin.entity';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { totpAt } from './totp';

/**
 * In-memory stand-in for the admins table: enough for the service's own
 * read/save cycle, and it keeps the tests honest about what is persisted.
 */
function buildRepo(seed: Partial<Admin> = {}) {
  const row: Admin = {
    id: 'admin-1',
    userId: 'user-1',
    email: 'admin@greyauction.com',
    name: 'Admin',
    role: AdminRole.SUPER_ADMIN,
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    mfaRecoveryCodes: [],
    mfaEnrolledAt: null,
    mfaFailedAttempts: 0,
    mfaLockedUntil: null,
    mfaLastStep: null,
    lastMfaAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...seed,
  } as Admin;

  return {
    row,
    findOne: jest.fn(async () => (row.isActive === false && row.mfaEnabled === false && row.id === 'missing' ? null : row)),
    save: jest.fn(async (entity: Admin) => entity),
    find: jest.fn(async () => [row]),
  };
}

describe('AdminMfaService', () => {
  let service: AdminMfaService;
  let repo: ReturnType<typeof buildRepo>;
  let settings: { get: jest.Mock; set: jest.Mock };
  let audit: { logAction: jest.Mock };
  let jwt: { sign: jest.Mock; verify: jest.Mock };
  let enrolledSecret = '';

  const build = (seed: Partial<Admin> = {}) => {
    repo = buildRepo(seed);
    settings = { get: jest.fn(async () => ({})), set: jest.fn(async () => undefined) };
    audit = { logAction: jest.fn(async () => undefined) };
    jwt = { sign: jest.fn(() => 'challenge'), verify: jest.fn(() => ({ sub: 'user-1', typ: 'mfa_challenge' })) };
    service = new AdminMfaService(
      repo as any,
      settings as unknown as SettingsService,
      jwt as unknown as JwtService,
      audit as unknown as AuditService,
    );
  };

  beforeEach(() => build());

  describe('policy', () => {
    it('defaults to requiring a second factor for every admin role', async () => {
      const policy = await service.policy();
      expect(policy.required).toBe(true);
      for (const role of Object.values(AdminRole)) {
        expect(policy.roles[role].required).toBe(true);
      }
    });

    it('gives the roles that can move money the shortest step-up window', async () => {
      const policy = await service.policy();
      expect(policy.roles[AdminRole.SUPER_ADMIN].stepUpMinutes).toBeLessThanOrEqual(
        policy.roles[AdminRole.SUPPORT_ADMIN].stepUpMinutes,
      );
      expect(policy.roles[AdminRole.FINANCE_ADMIN].stepUpMinutes).toBeLessThan(
        policy.roles[AdminRole.PLATFORM_ADMIN].stepUpMinutes,
      );
    });

    it('merges a stored policy over the defaults without dropping roles', async () => {
      settings.get.mockResolvedValue({
        required: true,
        roles: { support_admin: { required: false, stepUpMinutes: 45 } },
      });
      const policy = await service.policy();
      expect(policy.roles.support_admin).toEqual({ required: false, stepUpMinutes: 45 });
      expect(policy.roles.super_admin.required).toBe(true);
    });

    it('clamps a nonsense step-up window to something sane', async () => {
      settings.get.mockResolvedValue({
        roles: { platform_admin: { required: true, stepUpMinutes: 100_000 } },
      });
      expect((await service.policy()).roles.platform_admin.stepUpMinutes).toBe(120);
    });

    it('refuses to let an unknown role be configured', async () => {
      await expect(
        service.updatePolicy({ roles: { wizard: { required: true, stepUpMinutes: 5 } } }, repo.row),
      ).rejects.toThrow(BadRequestException);
    });

    it('records a policy change in the audit trail', async () => {
      await service.updatePolicy({ roles: { support_admin: { required: true, stepUpMinutes: 20 } } }, repo.row);
      expect(settings.set).toHaveBeenCalledWith(
        'mfaPolicy',
        expect.objectContaining({ roles: expect.any(Object) }),
      );
      expect(audit.logAction).toHaveBeenCalledWith(
        repo.row.id,
        expect.anything(),
        expect.anything(),
        repo.row.id,
        expect.anything(),
        { event: 'mfa_policy_updated' },
      );
    });
  });

  describe('sign-in gate', () => {
    it('returns null for an account that is not an administrator', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.gateForUser('nobody')).resolves.toBeNull();
    });

    it('demands enrolment for an admin who has not enrolled', async () => {
      await expect(service.gateForUser('user-1')).resolves.toEqual({
        mfaRequired: true,
        enrolmentRequired: true,
      });
    });

    it('demands a code, but not enrolment, once enrolled', async () => {
      build({ mfaEnabled: true, mfaSecret: 'x' });
      await expect(service.gateForUser('user-1')).resolves.toEqual({
        mfaRequired: true,
        enrolmentRequired: false,
      });
    });

    it('still challenges an admin who enrolled voluntarily when the policy is off', async () => {
      build({ mfaEnabled: true, mfaSecret: 'x' });
      settings.get.mockResolvedValue({ required: false });
      await expect(service.gateForUser('user-1')).resolves.toEqual({
        mfaRequired: true,
        enrolmentRequired: false,
      });
    });
  });

  describe('enrolment and verification', () => {
    it('arms MFA only once a code from the new secret is confirmed', async () => {
      const { secret, recoveryCodes } = await service.beginEnrolment('user-1');
      expect(repo.row.mfaEnabled).toBe(false);
      expect(repo.row.mfaSecret).not.toBe(secret); // encrypted at rest
      expect(repo.row.mfaSecret).not.toContain(secret);
      // Codes are issued at setup, because setup happens before there is a
      // session in which to show them.
      expect(recoveryCodes).toHaveLength(10);
      // The plaintext codes are not stored — only hashes.
      expect(JSON.stringify(repo.row.mfaRecoveryCodes)).not.toContain(
        recoveryCodes[0].replace('-', ''),
      );

      const result = await service.confirmEnrolment('user-1', totpAt(secret, Date.now()));
      expect(result).toEqual({ enabled: true });
      expect(repo.row.mfaEnabled).toBe(true);
    });

    it('refuses confirmation with a wrong code and leaves MFA off', async () => {
      await service.beginEnrolment('user-1');
      await expect(service.confirmEnrolment('user-1', '000000')).rejects.toThrow(BadRequestException);
      expect(repo.row.mfaEnabled).toBe(false);
    });

    it('verifies a correct code and records the moment for step-up', async () => {
      const secret = await enrol();
      const result = await service.verifySecondFactor('user-1', totpAt(secret, Date.now()));
      expect(result.method).toBe('totp');
      expect(repo.row.lastMfaAt).toBeInstanceOf(Date);
      expect(repo.row.mfaFailedAttempts).toBe(0);
    });

    it('refuses a replayed code even inside its own window', async () => {
      const secret = await enrol();
      const code = totpAt(secret, Date.now());
      await service.verifySecondFactor('user-1', code);
      await expect(service.verifySecondFactor('user-1', code)).rejects.toThrow(UnauthorizedException);
    });

    it('locks the account after five wrong codes and reports the wait', async () => {
      await enrol();
      for (let i = 0; i < 5; i += 1) {
        await expect(service.verifySecondFactor('user-1', '000000')).rejects.toThrow();
      }
      expect(repo.row.mfaLockedUntil).toBeInstanceOf(Date);
      await expect(service.verifySecondFactor('user-1', '000000')).rejects.toThrow(ForbiddenException);
    });

    it('accepts a recovery code once, and only once', async () => {
      const { codes } = await enrolWithCodes();
      const first = await service.verifySecondFactor('user-1', codes[0], { allowRecovery: true });
      expect(first.method).toBe('recovery');
      await expect(
        service.verifySecondFactor('user-1', codes[0], { allowRecovery: true }),
      ).rejects.toThrow(UnauthorizedException);
      // A recovery code is not accepted at a call site that did not ask for one.
      await expect(service.verifySecondFactor('user-1', codes[1])).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues a fresh set of recovery codes and retires the old ones', async () => {
      const { codes } = await enrolWithCodes();
      const next = await service.regenerateRecoveryCodes('user-1', totpAt(enrolledSecret, Date.now()));
      expect(next.recoveryCodes).toHaveLength(10);
      expect(next.recoveryCodes[0]).not.toBe(codes[0]);
      await expect(
        service.verifySecondFactor('user-1', codes[0], { allowRecovery: true }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('step-up', () => {
    it('is invalid immediately after enrolment in a different session window', async () => {
      await enrol();
      repo.row.lastMfaAt = new Date(Date.now() - 60 * 60_000);
      const state = await service.stepUpIsValid(repo.row);
      expect(state.valid).toBe(false);
      expect(state.window).toBe(5); // super_admin
    });

    it('is valid right after a proof, and expires when the window passes', async () => {
      await enrol();
      expect((await service.stepUpIsValid(repo.row)).valid).toBe(true);
      repo.row.lastMfaAt = new Date(Date.now() - 6 * 60_000);
      expect((await service.stepUpIsValid(repo.row)).valid).toBe(false);
    });

    it('never requires step-up when neither policy nor enrolment asks for a second factor', async () => {
      settings.get.mockResolvedValue({ required: false });
      repo.row.mfaEnabled = false;
      const state = await service.stepUpIsValid(repo.row);
      expect(state.valid).toBe(true);
    });

    it('reports the expiry a client can show', async () => {
      const secret = await enrol();
      const { expiresAt } = await service.stepUp('user-1', totpAt(secret, Date.now()));
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('management', () => {
    it('refuses to disable MFA when the policy requires it', async () => {
      const secret = await enrol();
      await expect(
        service.disable('user-1', totpAt(secret, Date.now()), repo.row),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.row.mfaEnabled).toBe(true);
    });

    it('allows disabling only after a code, when policy permits', async () => {
      const secret = await enrol();
      settings.get.mockResolvedValue({ required: false });
      await service.disable('user-1', totpAt(secret, Date.now()), repo.row);
      expect(repo.row.mfaEnabled).toBe(false);
      expect(repo.row.mfaSecret).toBeNull();
      expect(repo.row.mfaRecoveryCodes).toEqual([]);
    });

    it('publishes who is enrolled, and who can sign in without a second factor', async () => {
      await enrol();
      const overview = await service.overview();
      expect(overview.admins[0]).toMatchObject({
        id: 'admin-1',
        mfaEnabled: true,
        requiresMfa: true,
        recoveryCodesRemaining: 10,
      });
    });

    it('clears a lockout and audits it', async () => {
      repo.row.mfaLockedUntil = new Date(Date.now() + 600_000);
      repo.row.mfaFailedAttempts = 4;
      await service.clearLockout('admin-1', repo.row);
      expect(repo.row.mfaLockedUntil).toBeNull();
      expect(repo.row.mfaFailedAttempts).toBe(0);
      expect(audit.logAction).toHaveBeenCalledWith(
        repo.row.id,
        expect.anything(),
        expect.anything(),
        repo.row.id,
        undefined,
        { event: 'mfa_lockout_cleared' },
      );
    });

  });

  // ─── helpers ──────────────────────────────────────────────────

  /**
   * Enrol and return the plaintext secret.
   *
   * The code used to confirm enrolment is spent — the replay guard records its
   * step — so the recorded step is cleared here to model the next 30-second
   * window, which is what an administrator signing in moments later presents.
   */
  async function enrol(): Promise<string> {
    const { secret } = await service.beginEnrolment('user-1');
    await service.confirmEnrolment('user-1', totpAt(secret, Date.now()));
    enrolledSecret = secret;
    repo.row.mfaLastStep = null;
    return secret;
  }

  async function enrolWithCodes(): Promise<{ codes: string[]; secret: string }> {
    const { secret, recoveryCodes } = await service.beginEnrolment('user-1');
    await service.confirmEnrolment('user-1', totpAt(secret, Date.now()));
    enrolledSecret = secret;
    repo.row.mfaLastStep = null;
    return { codes: recoveryCodes, secret };
  }
});
