import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMProvider } from './entities/llm-provider.entity';
import { LLMModel } from './entities/llm-model.entity';
import { AIFeatureConfig } from './entities/ai-feature-config.entity';
import { AIUsageLog } from './entities/ai-usage-log.entity';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AIExecuteController, AIPublicExecuteController } from './ai-execute.controller';
import { AIOrchestratorService } from '../common/ai/services/ai-orchestrator.service';
import { AIUsageLogService } from '../common/ai/services/ai-usage-log.service';
import { ProviderHealthMonitorService } from './provider-health-monitor.service';

@Module({
  imports: [TypeOrmModule.forFeature([LLMProvider, LLMModel, AIFeatureConfig, AIUsageLog])],
  controllers: [AIController, AIExecuteController, AIPublicExecuteController],
  providers: [
    AIService,
    AIOrchestratorService,
    AIUsageLogService,
    ProviderHealthMonitorService,
  ],
  exports: [AIService, AIOrchestratorService, TypeOrmModule],
})
export class AIModule {}
