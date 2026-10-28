import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting } from './setting.entity';
import { AdminMfaModule } from '../admin-mfa/admin-mfa.module';

/**
 * Global on purpose.
 *
 * The MFA module reads the second-factor policy from settings, and this module
 * needs the step-up guard from the MFA module to protect a settings write. Both
 * explicit imports is a module cycle that Nest rejects. Making settings global
 * breaks the cycle in the direction that is safe — a leaf providing values —
 * rather than making the MFA module global, which would expose the guard's
 * internals everywhere for no reason.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting]), AdminMfaModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
