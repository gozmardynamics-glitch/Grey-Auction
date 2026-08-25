import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { GenerateInviteDto, ValidateInviteDto, RespondInviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Invites')
@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate an invite (optionally emails it)' })
  generate(@Req() req: any, @Body() dto: GenerateInviteDto) {
    return this.inviteService.generate(req.user.id, dto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an invite token' })
  validate(@Body() dto: ValidateInviteDto) {
    return this.inviteService.validate(dto.token);
  }

  @Post('respond')
  @ApiOperation({ summary: 'Accept or decline an invitation' })
  respond(@Body() dto: RespondInviteDto) {
    return this.inviteService.respond(dto.token, dto.response);
  }

  @Post('use')
  @ApiOperation({ summary: 'Use an invite (increments usage count)' })
  use(@Body() dto: ValidateInviteDto) {
    return this.inviteService.useInvite(dto.token);
  }

  @Post('request-access')
  @ApiOperation({ summary: 'Request access via a REQUEST-mode invite' })
  requestAccess(@Body() dto: { token: string; name?: string; email?: string }) {
    return this.inviteService.requestAccess(dto.token, {
      name: dto.name,
      email: dto.email,
    });
  }

  @Post('approve/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller approves a request-mode invite' })
  approve(@Req() req: any, @Param('id') id: string) {
    return this.inviteService.approve(id, req.user.id);
  }

  @Post('reject/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller rejects a request-mode invite' })
  reject(@Req() req: any, @Param('id') id: string) {
    return this.inviteService.reject(id, req.user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pending request-mode invites for the seller' })
  pending(@Req() req: any) {
    return this.inviteService.pendingRequests(req.user.id);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.inviteService.findByProduct(productId);
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.inviteService.findByRoom(roomId);
  }

  @Post('deactivate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.inviteService.deactivate(id, req.user.id);
  }
}
