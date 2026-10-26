import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Admin, AdminRole } from '../entities/admin.entity';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail CLOSED: an endpoint guarded by AdminRolesGuard but missing
    // @AdminRoles(...) is a config bug — never silently grant access (S8).
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException('No admin roles are authorized for this endpoint');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Privileged resolution requires a verified account — an unverified
    // registration must never reach admin surface area.
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Verify your email address before accessing admin endpoints');
    }

    // Authority comes from the admins row LINKED to this user id (admins.user_id).
    // The old email-string match let any user who set users.email to an admin
    // address inherit that admin's role. No link = no authority, full stop.
    let admin: Admin | null = null;
    try {
      admin = await this.dataSource.getRepository(Admin).findOne({
        where: { userId: user.id },
      });
    } catch {
      // DB unavailable — fail closed rather than falling back to the JWT role.
      throw new ForbiddenException('Admin authorization is unavailable');
    }

    if (!admin) {
      throw new ForbiddenException('Access denied');
    }
    if (!admin.isActive) {
      // Explicit rejection (the old code threw inside try/catch and the
      // deactivation was silently swallowed).
      throw new ForbiddenException('Admin account is deactivated');
    }

    request.user.adminRole = admin.role;
    // Expose the resolved admins row itself so admin attribution
    // (reviewedById, createdById, processed_by…) records the admin identity,
    // not the users-table id that merely authenticates.
    request.admin = admin;

    if (!requiredRoles.includes(admin.role)) {
      throw new ForbiddenException('Insufficient admin permissions');
    }

    return true;
  }
}
