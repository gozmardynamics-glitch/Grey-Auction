import { Module } from '@nestjs/common';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [AIModule],
  exports: [AIModule],
})
export class CommonAIModule {}
