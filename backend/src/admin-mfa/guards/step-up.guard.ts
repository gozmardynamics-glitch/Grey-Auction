import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AdminMfaService } from '../admin-mfa.service';
import { STEP_UP_KEY } from '../decorators/require-step-up.decorator';
import { Admin } from '../../admin/entities/admin.entity';

/**
 * Requires a recent second-factor proof for the marked route.
 *
 * The session's age is deliberately irrelevant: an administrator who signed in
 * this morning still has to prove a code to refund escrow now. The refusal
 * carries `code: 'STEP_UP_REQUIRED'` so the client can open the right dialog
 * instead of showing a generic "forbidden".
 *
 * Runs after AdminRolesGuard, which resolves `request.admin`.
 */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly mfa: AdminMfaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(STEP_UP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const admin: Admin | undefined = request.admin;
    if (!admin) {
      throw new ForbiddenException('Access denied');
    }

    const state = await this.mfa.stepUpIsValid(admin);
    if (state.valid) return true;

    throw new ForbiddenException({
      statusCode: 403,
      code: 'STEP_UP_REQUIRED',
      message: 'Confirm it is you with a code from your authenticator app to continue.',
      windowMinutes: state.window,
    });
  }
}
