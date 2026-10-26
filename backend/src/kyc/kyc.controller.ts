import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../common/storage/storage.service';
import { KycService } from './kyc.service';
import { UploadKycDocumentDto } from './dto/kyc.dto';

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
  constructor(
    private readonly service: KycService,
    private readonly storage: StorageService,
  ) {}

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

  /**
   * Submit or replace a document. Multipart only: the size, MIME type and
   * stored URL are derived from the uploaded object, so the document policy is
   * enforced by the server rather than asserted by the client.
   */
  @Post('documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload or replace a KYC document' })
  async submit(
    @CurrentUser() user: any,
    @Body() dto: UploadKycDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A file upload is required (form field "file")');
    }

    // Policy first: an unacceptable file must not be stored at all.
    await this.service.assertUploadAllowed(dto.requirementCode, file.mimetype, file.size);

    const stored = await this.storage.uploadFile(file, 'kyc');
    try {
      const data = await this.service.submitUpload(user.id, dto, {
        url: stored.url,
        fileName: stored.filename,
        size: stored.size,
        mimeType: stored.mimetype,
      });
      return { success: true, message: 'Document submitted for review', data };
    } catch (error) {
      // Never leave an orphaned object behind a rejected submission.
      await this.storage.deleteFile(stored.url).catch(() => undefined);
      throw error;
    }
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Withdraw a pending or rejected document' })
  @ApiParam({ name: 'id' })
  async withdraw(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.withdrawDocument(user.id, id);
    return { success: true, message: 'Document withdrawn' };
  }
}
