import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentInstance, AgentStatus } from './entities/agent-instance.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentWorkflow } from './entities/agent-workflow.entity';
import { AgentsService } from './agents.service';
import { AIOrchestratorService } from '../common/ai/services/ai-orchestrator.service';

export interface CoordinationEvent {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private readonly eventQueue: CoordinationEvent[] = [];
  private processing = false;

  constructor(
    private readonly agentsService: AgentsService,
    private readonly aiOrchestrator: AIOrchestratorService,
    @InjectRepository(AgentInstance) private readonly agentRepo: Repository<AgentInstance>,
    @InjectRepository(AgentWorkflow) private readonly workflowRepo: Repository<AgentWorkflow>,
  ) {}

  async executeAgent(agentId: string, input: Record<string, unknown>, context?: Record<string, unknown>) {
    const agent = await this.agentsService.findAgentById(agentId);
    if (!agent.isEnabled) throw new Error(`Agent ${agent.name} is disabled`);

    const start = Date.now();
    agent.status = AgentStatus.ACTIVE;
    await this.agentRepo.save(agent);

    try {
      const tools = await this.resolveTools(agent);
      const toolDescriptions = tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

      const prompt = this.buildPrompt(agent, input, toolDescriptions, context);
      const result = await this.aiOrchestrator.execute(agent.name, {
        prompt,
        messages: [{ role: 'user', content: JSON.stringify(input) }],
      });

      agent.status = AgentStatus.ACTIVE;
      await this.agentsService.recordMetric(agent.id, agent.name, 'execute', { input, result }, Date.now() - start, true);
      await this.agentRepo.save(agent);
      return result;
    } catch (err: any) {
      agent.status = AgentStatus.ERROR;
      await this.agentsService.recordMetric(agent.id, agent.name, 'execute', input, Date.now() - start, false, err.message);
      await this.agentRepo.save(agent);
      throw err;
    }
  }

  async triggerEvent(eventType: string, payload: Record<string, unknown>) {
    const event: CoordinationEvent = {
      type: eventType,
      source: 'system',
      payload,
      timestamp: new Date(),
    };
    this.eventQueue.push(event);
    await this.processEventQueue();

    const workflows = await this.workflowRepo.find({
      where: { triggerEvent: eventType, isEnabled: true },
    });
    for (const wf of workflows) {
      this.logger.log(`Triggering workflow ${wf.name} for event ${eventType}`);
      await this.agentsService.executeWorkflow(wf.id).catch((err) =>
        this.logger.warn(`Workflow ${wf.name} failed: ${err.message}`),
      );
    }
  }

  async discoverCapabilities() {
    const tools = await this.agentsService.findAllTools();
    const agents = await this.agentsService.findAllAgents();
    const unusedTools = tools.filter((t) => t.isEnabled && !agents.some((a) => a.toolIds?.includes(t.id)));
    const untooledAgents = agents.filter((a) => a.isEnabled && (!a.toolIds || a.toolIds.length === 0));

    return {
      unusedTools: unusedTools.map((t) => ({ id: t.id, name: t.name, category: t.category })),
      untooledAgents: untooledAgents.map((a) => ({ id: a.id, name: a.name, category: a.category })),
      suggestions: this.generateSuggestions(agents, tools),
    };
  }

  private generateSuggestions(agents: AgentInstance[], tools: AgentTool[]) {
    const suggestions: { agentId: string; agentName: string; suggestedTools: string[]; reason: string }[] = [];

    for (const agent of agents) {
      if (!agent.isEnabled) continue;
      const agentToolIds = agent.toolIds || [];
      const matchingTools = tools.filter((t) =>
        t.isEnabled && t.category === agent.category && !agentToolIds.includes(t.id),
      );

      if (matchingTools.length > 0) {
        suggestions.push({
          agentId: agent.id,
          agentName: agent.name,
          suggestedTools: matchingTools.map((t) => t.id),
          reason: `Unused tools in category "${agent.category}" that match agent ${agent.name}`,
        });
      }
    }
    return suggestions;
  }

  private async resolveTools(agent: AgentInstance): Promise<AgentTool[]> {
    if (!agent.toolIds || agent.toolIds.length === 0) return [];
    const tools: AgentTool[] = [];
    for (const id of agent.toolIds) {
      try {
        const tool = await this.agentsService.findToolById(id);
        if (tool && tool.isEnabled) tools.push(tool);
      } catch {}
    }
    return tools;
  }

  private buildPrompt(agent: AgentInstance, input: Record<string, unknown>, tools: { name: string; description: string; inputSchema: Record<string, unknown> }[], context?: Record<string, unknown>) {
    const toolsDesc = tools.length > 0
      ? `\n\nAvailable tools:\n${tools.map((t) => `- ${t.name}: ${t.description} (input: ${JSON.stringify(t.inputSchema)})`).join('\n')}`
      : '';

    const contextDesc = context
      ? `\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : '';

    return `${agent.systemPrompt || 'You are a helpful AI agent.'}\n\nTask: ${JSON.stringify(input)}${toolsDesc}${contextDesc}\n\nRespond with your analysis and actions taken.`;
  }

  private async processEventQueue() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) break;
        const agents = await this.agentRepo.find({ where: { isEnabled: true } });
        for (const agent of agents) {
          if (agent.triggerEvents?.includes(event.type)) {
            this.executeAgent(agent.id, event.payload).catch((err) =>
              this.logger.warn(`Agent ${agent.name} failed on event ${event.type}`),
            );
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
