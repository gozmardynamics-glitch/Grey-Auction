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

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Resolve actual admin role from the admins table (users.role is 'bidder'|'seller'|'admin')
    let effectiveRole: string = user.role;
    if (user.email) {
      try {
        const admin = await this.dataSource.getRepository(Admin).findOne({
          where: { email: user.email },
        });
        if (admin) {
          if (!admin.isActive) {
            throw new ForbiddenException('Admin account is inactive');
          }
          effectiveRole = admin.role;
          request.user.adminRole = admin.role;
        }
      } catch {
        // DB unavailable — fall back to JWT role
      }
    }

    if (!requiredRoles.includes(effectiveRole as AdminRole)) {
      throw new ForbiddenException('Insufficient admin permissions');
    }

    return true;
  }
}
