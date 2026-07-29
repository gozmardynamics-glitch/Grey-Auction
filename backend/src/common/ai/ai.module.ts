import { Module } from '@nestjs/common';
import { AIModule } from '../../ai/ai.module';
import { AIOrchestratorService } from './services/ai-orchestrator.service';
import { AIUsageLogService } from './services/ai-usage-log.service';

@Module({
  imports: [AIModule],
  providers: [AIOrchestratorService, AIUsageLogService],
  exports: [AIOrchestratorService],
})
export class CommonAIModule {}
