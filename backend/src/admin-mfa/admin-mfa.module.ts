import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Admin } from '../admin/entities/admin.entity';
import { AuditModule } from '../audit/audit.module';
import { AdminMfaService } from './admin-mfa.service';
import { StepUpGuard } from './guards/step-up.guard';

/**
 * Second-factor authentication for administrators.
 *
 * Deliberately depends on nothing from the admin or auth modules: both of them
 * depend on THIS (the guard needs the service, the login flow needs the gate),
 * and a cycle between auth, admin and MFA would fail at boot with an
 * unreachable provider.
 *
 * `SettingsService` is injected from the global settings module rather than
 * imported here — settings needs `StepUpGuard` for its write route, and two
 * explicit imports between the same pair of modules is a cycle.
 *
 * Global because `AdminRolesGuard` — used by a dozen modules, from Backup to
 * Escrow — now depends on `AdminMfaService`. Requiring each of them to import
 * this module would mean a boot-time crash for every module anybody adds later.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Admin]), AuditModule],
  providers: [AdminMfaService, StepUpGuard],
  exports: [AdminMfaService, StepUpGuard],
})
export class AdminMfaModule {}
