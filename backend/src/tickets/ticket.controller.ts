import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

const ADMIN_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.PLATFORM_ADMIN,
  AdminRole.FINANCE_ADMIN,
];

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my support tickets' })
  async findMine(@CurrentUser() user: any) {
    const data = await this.service.findAllByUser(user.id);
    return { success: true, data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all support tickets (admin)' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a ticket (owner or admin)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.requireOwnerOrAdmin(id, user);
    const data = await this.service.findById(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a support ticket' })
  async create(@Body() dto: Partial<Ticket>, @CurrentUser() user: any) {
    // Identity always comes from the session — never trust body-supplied
    // userId/userName/userEmail.
    const data = await this.service.create({
      ...dto,
      userId: user.id,
      userName: user.name || dto.userName || '',
      userEmail: user.email || dto.userEmail || '',
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
    const data = await this.service.sendMessage(id, user.id, dto.content);
    if (!data) throw new ForbiddenException('Not your ticket');
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
}
