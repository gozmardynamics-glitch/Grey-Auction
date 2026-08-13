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
