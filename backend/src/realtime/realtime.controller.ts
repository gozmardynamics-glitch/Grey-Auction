import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly service: RealtimeService) {}

  /** Issue a single-use, short-lived ticket for a WebSocket handshake. */
  @Post('ticket')
  @ApiOperation({ summary: 'Get a short-lived WebSocket ticket for this session' })
  issue(@CurrentUser() user: any) {
    const data = this.service.issue(user.id);
    return { success: true, data };
  }
}
