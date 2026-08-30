import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { AdminRole } from './entities/admin.entity';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN, AdminRole.FINANCE_ADMIN, AdminRole.SUPPORT_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Admins CRUD ────────────────────────────────────────────────
  @Get('admins')
  @ApiOperation({ summary: 'List all admins' })
  async findAllAdmins() {
    const data = await this.adminService.findAllAdmins();
    return { success: true, data };
  }

  @Post('admins')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create admin' })
  async createAdmin(@Body() dto: { email: string; password: string; name: string; role?: AdminRole }) {
    const data = await this.adminService.createAdmin(dto);
    return { success: true, message: 'Admin created', data };
  }

  @Patch('admins/:id')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: { name?: string; role?: AdminRole; isActive?: boolean },
  ) {
    const data = await this.adminService.updateAdmin(id, dto);
    return { success: true, message: 'Admin updated', data };
  }

  @Delete('admins/:id')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete admin' })
  async removeAdmin(@Param('id') id: string) {
    await this.adminService.removeAdmin(id);
    return { success: true, message: 'Admin removed' };
  }

  // ─── Buyers Management ──────────────────────────────────────────
  @Get('buyers')
  @ApiOperation({ summary: 'List all buyers' })
  async findAllBuyers() {
    const data = await this.adminService.findAllBuyers();
    return { success: true, data };
  }

  @Post('buyers/:id/suspend')
  @ApiOperation({ summary: 'Suspend buyer' })
  async suspendBuyer(@Param('id') id: string) {
    const data = await this.adminService.setBuyerStatus(id, false);
    return { success: true, message: 'Buyer suspended', data };
  }

  @Post('buyers/:id/activate')
  @ApiOperation({ summary: 'Activate buyer' })
  async activateBuyer(@Param('id') id: string) {
    const data = await this.adminService.setBuyerStatus(id, true);
    return { success: true, message: 'Buyer activated', data };
  }
}
