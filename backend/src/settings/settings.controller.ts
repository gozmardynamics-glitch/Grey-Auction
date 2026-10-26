import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  SETTINGS_SECTION_FIELDS,
  UpdateSettingsDto,
  isKnownSection,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get(':section')
  async get(@Param('section') section: string) {
    const data = await this.service.get(section);
    return { success: true, data };
  }

  /**
   * Save a settings group.
   *
   * The path segment is the storage key (`general`, `email`, `security`,
   * `notifications`); the payload's optional `section` names the sub-group
   * (`siteConfig`, `smtp`, `authentication`…) and decides which fields are
   * legal. Unknown properties are already rejected by the global validation
   * pipe; this also refuses a known field sent under the wrong group, which
   * used to be stored silently.
   */
  @Put(':section')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  async set(@Param('section') section: string, @Body() dto: UpdateSettingsDto) {
    const group = dto.section ?? section;
    if (!isKnownSection(group)) {
      throw new BadRequestException(
        `Unknown settings section "${group}". Accepted: ${Object.keys(SETTINGS_SECTION_FIELDS).join(', ')}.`,
      );
    }

    const allowed = SETTINGS_SECTION_FIELDS[group];
    const provided = Object.keys(dto).filter((key) => key !== 'section');
    const misplaced = provided.filter((key) => !allowed.includes(key));
    if (misplaced.length > 0) {
      throw new BadRequestException(
        `Field(s) ${misplaced.join(', ')} do not belong to the "${group}" settings group.`,
      );
    }

    await this.service.set(section, dto);
    return { success: true, message: `${group} settings saved` };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAll() {
    return this.service.getAll();
  }
}
