import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AdminRolesGuard } from './admin-roles.guard';
import { Admin, AdminRole } from '../entities/admin.entity';
import { AdminMfaService } from '../../admin-mfa/admin-mfa.service';

describe('AdminRolesGuard', () => {
  let guard: AdminRolesGuard;
  const reflector = { getAllAndOverride: jest.fn() };
  const adminFindOne = jest.fn();
  const dataSource = { getRepository: jest.fn(() => ({ findOne: adminFindOne })) };
  const mfa = { requirementFor: jest.fn() };

  const buildContext = (user: any) => {
    const request: any = { user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as any;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Policy requires MFA by default, as it does in production.
    mfa.requirementFor.mockResolvedValue({ required: true, stepUpMinutes: 10 });
    guard = new AdminRolesGuard(
      reflector as unknown as Reflector,
      dataSource as unknown as DataSource,
      mfa as unknown as AdminMfaService,
    );
  });

  it('fails closed when the endpoint declares no @AdminRoles', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    await expect(guard.canActivate(buildContext({ id: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('denies an unauthenticated request', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(ForbiddenException);
    expect(adminFindOne).not.toHaveBeenCalled();
  });

  it('denies an unverified email even with a linked admin row', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    await expect(
      guard.canActivate(buildContext({ id: 'u1', email: 'a@b.c', isEmailVerified: false })),
    ).rejects.toThrow('Verify your email address');
    expect(adminFindOne).not.toHaveBeenCalled();
  });

  it('denies a user with no linked admins row — even when an admin shares the email', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    adminFindOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ id: 'attacker', email: 'admin@greyauction.com', isEmailVerified: true })),
    ).rejects.toThrow(ForbiddenException);

    // The lookup must be by user id, NOT by the caller-supplied email string.
    expect(adminFindOne).toHaveBeenCalledWith({ where: { userId: 'attacker' } });
  });

  it('rejects a deactivated admin explicitly', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    adminFindOne.mockResolvedValue({ role: AdminRole.SUPER_ADMIN, isActive: false });

    await expect(
      guard.canActivate(buildContext({ id: 'u1', isEmailVerified: true })),
    ).rejects.toThrow('deactivated');
  });

  it('grants access for a linked, active admin with a sufficient role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN]);
    adminFindOne.mockResolvedValue({ role: AdminRole.PLATFORM_ADMIN, isActive: true, mfaEnabled: true });

    const ctx = buildContext({ id: 'u1', isEmailVerified: true });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('denies an otherwise-valid admin who has not enrolled a second factor', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    adminFindOne.mockResolvedValue({ role: AdminRole.SUPER_ADMIN, isActive: true, mfaEnabled: false });

    await expect(
      guard.canActivate(buildContext({ id: 'u1', isEmailVerified: true })),
    ).rejects.toMatchObject({
      response: { code: 'MFA_ENROLMENT_REQUIRED' },
    });
  });

  it('lets an unenrolled admin through only when the policy does not require MFA', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPPORT_ADMIN]);
    adminFindOne.mockResolvedValue({ role: AdminRole.SUPPORT_ADMIN, isActive: true, mfaEnabled: false });
    mfa.requirementFor.mockResolvedValue({ required: false, stepUpMinutes: 15 });

    await expect(
      guard.canActivate(buildContext({ id: 'u1', isEmailVerified: true })),
    ).resolves.toBe(true);
  });

  it('denies when the linked admin role is insufficient', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    adminFindOne.mockResolvedValue({ role: AdminRole.SUPPORT_ADMIN, isActive: true, mfaEnabled: true });

    await expect(
      guard.canActivate(buildContext({ id: 'u1', isEmailVerified: true })),
    ).rejects.toThrow('Insufficient admin permissions');
  });

  it('fails closed when the admins table is unreachable', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([AdminRole.SUPER_ADMIN]);
    adminFindOne.mockRejectedValue(new Error('connection refused'));

    await expect(
      guard.canActivate(buildContext({ id: 'u1', isEmailVerified: true })),
    ).rejects.toThrow('unavailable');
  });
});
