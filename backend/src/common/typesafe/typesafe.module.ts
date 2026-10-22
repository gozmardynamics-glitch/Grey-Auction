import { Module } from '@nestjs/common';
import { TypeSafeService } from './typesafe.service';
import { ListingModerationService } from './listing-moderation.service';

@Module({
  providers: [TypeSafeService, ListingModerationService],
  exports: [TypeSafeService, ListingModerationService],
})
export class TypeSafeModule {}
