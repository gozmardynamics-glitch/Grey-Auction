import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { SubmitKycDocumentDto } from './dto/kyc.dto';

/**
 * Account-holder-facing KYC.
 *
 * Lives on its own `kyc` root rather than under `buyers/*`: an account holder
 * both bids and sells, so these routes belong to the person, not to a role —
 * and a separate root avoids colliding with parameterised sibling routes.
 */
@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly service: KycService) {}

  @Get('requirements')
  @ApiOperation({
    summary: 'Document requirements for the account holder, with my submissions',
  })
  async requirements(@CurrentUser() user: any) {
    const data = await this.service.checklistFor(user.id);
    return { success: true, data };
  }

  @Get('status')
  @ApiOperation({ summary: 'My KYC status (verified / outstanding / rejected)' })
  async status(@CurrentUser() user: any) {
    const data = await this.service.statusFor(user.id);
    return { success: true, data };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Documents I have submitted' })
  async myDocuments(@CurrentUser() user: any) {
    const data = await this.service.listMyDocuments(user.id);
    return { success: true, data };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Submit or replace a KYC document' })
  async submit(@CurrentUser() user: any, @Body() dto: SubmitKycDocumentDto) {
    const data = await this.service.submitDocument(user.id, dto);
    return { success: true, message: 'Document submitted for review', data };
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Withdraw a pending or rejected document' })
  @ApiParam({ name: 'id' })
  async withdraw(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.withdrawDocument(user.id, id);
    return { success: true, message: 'Document withdrawn' };
  }
}
