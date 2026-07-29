import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMProvider } from './entities/llm-provider.entity';
import { LLMModel } from './entities/llm-model.entity';
import { AIFeatureConfig } from './entities/ai-feature-config.entity';
import { AIUsageLog } from './entities/ai-usage-log.entity';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AIExecuteController, AIPublicExecuteController } from './ai-execute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LLMProvider, LLMModel, AIFeatureConfig, AIUsageLog])],
  controllers: [AIController, AIExecuteController, AIPublicExecuteController],
  providers: [AIService],
  exports: [AIService, TypeOrmModule],
})
export class AIModule {}
