import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionReport } from './entities/condition-report.entity';
import { Dispute, DisputeFeedback } from './entities/dispute.entity';
import { Product } from '../products/entities/product.entity';
import { Seller } from '../seller/entities/seller.entity';
import { SellerDocument } from '../seller/entities/seller-document.entity';
import { ConditionReportService } from './condition-report.service';
import { DisputeService } from './dispute.service';
import { KycBadgeService } from './kyc-badge.service';
import {
  ConditionReportController,
  DisputeController,
  KycBadgeController,
} from './trust.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConditionReport, Dispute, DisputeFeedback, Product, Seller, SellerDocument]),
  ],
  controllers: [ConditionReportController, KycBadgeController, DisputeController],
  providers: [ConditionReportService, DisputeService, KycBadgeService],
  exports: [ConditionReportService, DisputeService, KycBadgeService],
})
export class TrustModule {}
