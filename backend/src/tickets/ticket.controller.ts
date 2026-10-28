import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { TicketSlaCron } from './ticket-sla.cron';
import {
  Ticket,
  TicketCategory,
  TicketClosureReason,
  TicketOutcome,
  TicketSeverity,
  TicketStatus,
} from './ticket.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

const ADMIN_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.PLATFORM_ADMIN,
  AdminRole.FINANCE_ADMIN,
  AdminRole.SUPPORT_ADMIN,
];

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly service: TicketService,
    private readonly slaCron: TicketSlaCron,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my support tickets' })
  async findMine(@CurrentUser() user: any) {
    const data = await this.service.findAllByUser(user.id);
    return { success: true, data: data.map((ticket) => ({ ...ticket, sla: this.slaFor(ticket) })) };
  }

  /**
   * Service-level counts for the admin dashboard.
   *
   * Declared before `:id` — a literal segment after a parameterised one is never
   * reached, which has bitten this codebase before.
   */
  @Get('sla/summary')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complaint service levels at a glance (admin)' })
  async slaSummary() {
    return { success: true, data: await this.service.slaSummary() };
  }

  /** Run the SLA sweep now (it otherwise runs hourly). */
  @Post('sla/sweep')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run the complaint SLA sweep immediately (admin)' })
  async sweep() {
    await this.slaCron.sweep();
    return { success: true, message: 'SLA sweep completed' };
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complaint outcomes and SLA performance (admin)' })
  async performance() {
    return { success: true, data: await this.service.performance() };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiQuery({ name: 'severity', required: false, enum: TicketSeverity })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiOperation({ summary: 'Complaint queue, soonest deadline first (admin)' })
  async findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('overdue') overdue?: string,
  ) {
    const data = await this.service.findAll({
      status,
      category,
      severity,
      overdue: overdue === 'true' || overdue === '1',
    });
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a ticket (owner or admin)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.requireOwnerOrAdmin(id, user);
    const data = await this.service.findById(id);
    return { success: true, data: data ? { ...data, sla: this.slaFor(data) } : null };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a support ticket or complaint' })
  async create(
    @Body()
    dto: Partial<Ticket> & { subject: string; category?: string; severity?: string },
    @CurrentUser() user: any,
  ) {
    // Identity always comes from the session — never trust body-supplied
    // userId/userName/userEmail.
    const data = await this.service.create({
      subject: dto.subject,
      description: dto.description,
      category: dto.category,
      severity: dto.severity,
      source: 'dashboard',
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
    return { success: true, data };
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a ticket (owner or admin)' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: { content: string },
    @CurrentUser() user: any,
  ) {
    // The sender is the authenticated user; ticket access is scoped below.
    await this.requireOwnerOrAdmin(id, user);
    const data = await this.service.sendMessage(id, user.id, dto.content, {
      staff: user?.role === 'admin',
    });
    if (!data) throw new ForbiddenException('Not your ticket');
    return { success: true, data };
  }

  /**
   * Resolve or close a complaint.
   *
   * Requires an outcome on resolve and a reason on close: a complaint that ends
   * without either cannot be reported on, and "vexatious" closures must be on the
   * record.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve or close a complaint (admin)' })
  async setStatus(
    @Param('id') id: string,
    @Body()
    dto: { status: TicketStatus; outcome?: TicketOutcome; closureReason?: TicketClosureReason; note?: string },
  ) {
    const data = await this.service.setStatus(id, dto);
    return { success: true, data };
  }

  @Patch(':id/escalate')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escalate a complaint for internal review (admin)' })
  async escalate(
    @Param('id') id: string,
    @Body() dto: { toAdminId?: string; note?: string },
    @CurrentUser() user: any,
  ) {
    const data = await this.service.escalate(id, {
      toAdminId: dto.toAdminId ?? user?.id,
      note: dto.note,
    });
    return { success: true, data };
  }

  /** Owner or admin access to a single ticket (mirrors invoices). */
  private async requireOwnerOrAdmin(id: string, user: any) {
    const ticket = await this.service.findById(id);
    if (!ticket) return;
    if (user?.role === 'admin') return;
    if (ticket.userId === user?.id) return;
    throw new ForbiddenException('Not your ticket');
  }

  /** Local SLA projection for a single row (kept out of the entity). */
  private slaFor(ticket: Ticket) {
    return this.service.viewFor(ticket);
  }
}
