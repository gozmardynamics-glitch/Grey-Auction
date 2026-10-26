import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentInstance } from './entities/agent-instance.entity';
import { LLMProvider } from '../ai/entities/llm-provider.entity';
import { LLMModel } from '../ai/entities/llm-model.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentWorkflow } from './entities/agent-workflow.entity';
import { AgentMetric } from './entities/agent-metric.entity';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AgentGapAnalyzerService } from './agent-gap-analyzer.service';
import { MCPServerService } from './mcp/mcp.server';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentInstance,
      LLMProvider,
      LLMModel, AgentTool, AgentWorkflow, AgentMetric]), AIModule],
  controllers: [AgentsController],
  providers: [AgentsService, AgentOrchestratorService, AgentGapAnalyzerService, MCPServerService],
  exports: [AgentsService, AgentOrchestratorService, MCPServerService],
})
export class AgentsModule {}
