import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { GenerateInviteDto, ValidateInviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Invites')
@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generate(@Req() req: any, @Body() dto: GenerateInviteDto) {
    return this.inviteService.generate(req.user.id, dto);
  }

  @Post('validate')
  validate(@Body() dto: ValidateInviteDto) {
    return this.inviteService.validate(dto.token);
  }

  @Post('use')
  use(@Body() dto: ValidateInviteDto) {
    return this.inviteService.useInvite(dto.token);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.inviteService.findByProduct(productId);
  }

  @Post('deactivate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.inviteService.deactivate(id, req.user.id);
  }
}
