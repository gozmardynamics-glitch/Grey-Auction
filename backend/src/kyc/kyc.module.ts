import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KycDocumentRequirement } from './entities/kyc-document-requirement.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { KycController } from './kyc.controller';
import { KycAdminController } from './kyc-admin.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([KycDocumentRequirement, KycDocument])],
  controllers: [KycController, KycAdminController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
