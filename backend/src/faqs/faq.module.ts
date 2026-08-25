import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from './faq.entity';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { FaqPublicController } from './faq-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Faq])],
  controllers: [FaqController, FaqPublicController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
