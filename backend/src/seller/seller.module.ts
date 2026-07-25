import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerController } from './seller.controller';
import {
  SellerService,
  SellerDocumentService,
  SellerPayoutService,
  SellerReviewService,
  SellerStatisticsService,
} from './services';
import {
  Seller,
  SellerDocument,
  SellerPayout,
  SellerReview,
  SellerStatistics,
} from './entities';
import {
  SellerGuard,
  VerifiedSellerGuard,
  SellerOwnershipGuard,
} from './guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seller,
      SellerDocument,
      SellerPayout,
      SellerReview,
      SellerStatistics,
    ]),
  ],
  controllers: [SellerController],
  providers: [
    // Services
    SellerService,
    SellerDocumentService,
    SellerPayoutService,
    SellerReviewService,
    SellerStatisticsService,
    // Guards
    SellerGuard,
    VerifiedSellerGuard,
    SellerOwnershipGuard,
  ],
  exports: [
    // Export services for use in other modules
    SellerService,
    SellerDocumentService,
    SellerPayoutService,
    SellerReviewService,
    SellerStatisticsService,
    // Export guards for use in other modules
    SellerGuard,
    VerifiedSellerGuard,
    SellerOwnershipGuard,
  ],
})
export class SellerModule {}
