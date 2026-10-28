import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminMfaService } from '../admin-mfa/admin-mfa.service';
import {
  AuthenticatedEnrolConfirmDto,
  StepUpDto,
  UpdateMfaPolicyDto,
} from '../admin-mfa/dto/mfa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireStepUp } from '../admin-mfa/decorators/require-step-up.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { Admin, AdminRole } from './entities/admin.entity';

/**
 * An administrator's own second factor, plus the controls a super admin needs
 * to run the policy.
 *
 * Everything here reads and writes the *authenticated admin's own* record: there
 * is no route that takes somebody else's code, because a code belongs to a
 * device and not to a role.
 */
@ApiTags('Admin · MFA')
@Controller('admin/mfa')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminMfaController {
  constructor(private readonly mfa: AdminMfaService) {}

  @Get('status')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'My two-factor status, policy and step-up window' })
  async status(@CurrentAdmin() admin: Admin) {
    return { success: true, data: await this.mfa.statusFor(admin.userId) };
  }

  /**
   * Re-prove a second factor to unlock a consequential action. Refreshes the
   * proof for this admin only, for the window their role allows.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('step-up')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'Confirm a code to authorise sensitive actions' })
  async stepUp(@Body() dto: StepUpDto, @CurrentAdmin() admin: Admin) {
    const data = await this.mfa.stepUp(admin.userId, dto.code);
    return { success: true, message: 'Confirmed', data };
  }

  /** Rotate the authenticator: start a new secret while still signed in. */
  @Post('enrol/begin')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'Start setting up a new authenticator device' })
  async beginEnrolment(@CurrentAdmin() admin: Admin) {
    const data = await this.mfa.beginEnrolment(admin.userId);
    return { success: true, message: 'Scan the code, then confirm', data };
  }

  @Post('enrol/confirm')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'Confirm the new authenticator and get fresh recovery codes' })
  async confirmEnrolment(
    @Body() dto: AuthenticatedEnrolConfirmDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const data = await this.mfa.confirmEnrolment(admin.userId, dto.code);
    return { success: true, message: 'Authenticator updated', data };
  }

  @Post('recovery-codes')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'Replace my recovery codes (code required)' })
  async regenerateRecoveryCodes(
    @Body() dto: AuthenticatedEnrolConfirmDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const data = await this.mfa.regenerateRecoveryCodes(admin.userId, dto.code);
    return {
      success: true,
      message: 'New recovery codes issued. The old ones no longer work.',
      data,
    };
  }

  @Post('disable')
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.PLATFORM_ADMIN,
    AdminRole.FINANCE_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  )
  @ApiOperation({ summary: 'Turn off my two-factor (refused when policy requires it)' })
  async disable(@Body() dto: AuthenticatedEnrolConfirmDto, @CurrentAdmin() admin: Admin) {
    const data = await this.mfa.disable(admin.userId, dto.code, admin);
    return { success: true, message: 'Two-factor authentication is off', data };
  }

  // ─── Super admin oversight ──────────────────────────────────────

  @Get('overview')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enrolment state for every administrator' })
  async overview() {
    return { success: true, data: await this.mfa.overview() };
  }

  @Get('policy')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Current two-factor policy (super admin)' })
  async policy() {
    return { success: true, data: await this.mfa.policy() };
  }

  @Put('policy')
  @RequireStepUp()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change the MFA requirement and step-up windows (super admin)' })
  async updatePolicy(@Body() dto: UpdateMfaPolicyDto, @CurrentAdmin() admin: Admin) {
    const data = await this.mfa.updatePolicy(dto, admin);
    return { success: true, message: 'Two-factor policy saved', data };
  }

  @Post(':adminId/unlock')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clear a lockout caused by repeated wrong codes (super admin)' })
  async unlock(@Param('adminId') adminId: string, @CurrentAdmin() admin: Admin) {
    const data = await this.mfa.clearLockout(adminId, admin);
    return { success: true, message: 'Lockout cleared', data };
  }

  /**
   * Reset somebody else's second factor — the documented path back in when a
   * phone and the recovery codes are both gone.
   */
  @Post(':adminId/reset')
  @RequireStepUp()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset an administrator’s second factor so they can re-enrol (super admin)' })
  async reset(@Param('adminId') adminId: string, @CurrentAdmin() admin: Admin) {
    const data = await this.mfa.resetEnrolment(adminId, admin);
    return {
      success: true,
      message: 'Second factor reset — the administrator will set it up again at their next sign-in',
      data,
    };
  }
}
