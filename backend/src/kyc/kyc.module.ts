import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KycDocumentRequirement } from './entities/kyc-document-requirement.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { User } from '../auth/entities/user.entity';
import { Seller } from '../seller/entities/seller.entity';
import { StorageModule } from '../common/storage/storage.module';
import { KycController } from './kyc.controller';
import { KycAdminController } from './kyc-admin.controller';
import { KycService } from './kyc.service';
import { KycRiskService } from './kyc-risk.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycDocumentRequirement, KycDocument, User, Seller]),
    StorageModule,
  ],
  controllers: [KycController, KycAdminController],
  providers: [KycService, KycRiskService],
  exports: [KycService, KycRiskService],
})
export class KycModule {}
