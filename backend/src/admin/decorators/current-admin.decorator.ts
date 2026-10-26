import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Admin } from '../entities/admin.entity';

/**
 * The resolved admin row for this request.
 *
 * `AdminRolesGuard` attaches it after linking the JWT account to `admins.user_id`;
 * attribution columns must record THIS id, not the users-table id, or an
 * approval cannot be joined back to the admin who made it. Falls back to the
 * authenticated user object for routes that carry JWT auth but no admin guard.
 */
export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Admin => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin ?? request.user;
  },
);
