import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentInstance, AgentStatus } from './entities/agent-instance.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentWorkflow, WorkflowStatus } from './entities/agent-workflow.entity';
import { AgentMetric } from './entities/agent-metric.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { CreateToolDto, CreateWorkflowDto, UpdateWorkflowDto } from './dto/tool-workflow.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectRepository(AgentInstance) private readonly agentRepo: Repository<AgentInstance>,
    @InjectRepository(AgentTool) private readonly toolRepo: Repository<AgentTool>,
    @InjectRepository(AgentWorkflow) private readonly workflowRepo: Repository<AgentWorkflow>,
    @InjectRepository(AgentMetric) private readonly metricRepo: Repository<AgentMetric>,
  ) {}

  async findAllAgents() { return this.agentRepo.find({ order: { category: 'ASC', name: 'ASC' } }); }
  async findAgentById(id: string) {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }
  async createAgent(dto: CreateAgentDto) { return this.agentRepo.save(this.agentRepo.create(dto)); }
  async updateAgent(id: string, dto: UpdateAgentDto) { await this.agentRepo.update(id, dto); return this.findAgentById(id); }
  async removeAgent(id: string) { const agent = await this.findAgentById(id); await this.agentRepo.remove(agent); }
  async toggleAgent(id: string) {
    const agent = await this.findAgentById(id);
    agent.isEnabled = !agent.isEnabled;
    if (!agent.isEnabled) agent.status = AgentStatus.INACTIVE;
    return this.agentRepo.save(agent);
  }

  async findAllTools() { return this.toolRepo.find({ order: { category: 'ASC', name: 'ASC' } }); }
  async findToolById(id: string) {
    const tool = await this.toolRepo.findOne({ where: { id } });
    if (!tool) throw new NotFoundException(`Tool ${id} not found`);
    return tool;
  }
  async createTool(dto: CreateToolDto) { return this.toolRepo.save(this.toolRepo.create(dto)); }
  async updateTool(id: string, dto: Partial<CreateToolDto>) { await this.toolRepo.update(id, dto); return this.findToolById(id); }
  async removeTool(id: string) { const tool = await this.findToolById(id); await this.toolRepo.remove(tool); }

  async findAllWorkflows() { return this.workflowRepo.find({ order: { createdAt: 'DESC' } }); }
  async findWorkflowById(id: string) {
    const wf = await this.workflowRepo.findOne({ where: { id } });
    if (!wf) throw new NotFoundException(`Workflow ${id} not found`);
    return wf;
  }
  async createWorkflow(dto: CreateWorkflowDto) {
    return this.workflowRepo.save(this.workflowRepo.create({ ...dto, steps: dto.steps as any }));
  }
  async updateWorkflow(id: string, dto: UpdateWorkflowDto) {
    const update: any = { ...dto };
    if (dto.steps) update.steps = dto.steps;
    await this.workflowRepo.update(id, update);
    return this.findWorkflowById(id);
  }
  async removeWorkflow(id: string) { const wf = await this.findWorkflowById(id); await this.workflowRepo.remove(wf); }
  async executeWorkflow(id: string) {
    const wf = await this.findWorkflowById(id);
    wf.status = WorkflowStatus.RUNNING;
    await this.workflowRepo.save(wf);

    try {
      for (const step of wf.steps) {
        const agent = await this.agentRepo.findOne({ where: { id: step.agentId } });
        const tool = await this.toolRepo.findOne({ where: { id: step.toolId } });
        if (!agent || !agent.isEnabled) continue;
        if (!tool || !tool.isEnabled) continue;

        const start = Date.now();
        try {
          await this.callToolEndpoint(tool, step.input);
          await this.recordMetric(agent.id, agent.name, `workflow_step_${step.id}`, {}, Date.now() - start, true);
        } catch (err: any) {
          await this.recordMetric(agent.id, agent.name, `workflow_step_${step.id}`, {}, Date.now() - start, false, err.message);
          if (step.onFailure === 'stop') throw err;
        }
      }
      wf.status = WorkflowStatus.ACTIVE;
      wf.totalRuns++;
      wf.lastRunAt = new Date();
      wf.lastError = null;
    } catch (err: any) {
      wf.status = WorkflowStatus.FAILED;
      wf.lastError = err.message;
    }
    return this.workflowRepo.save(wf);
  }

  async findMetrics(agentId?: string, limit = 200) {
    const where: any = {};
    if (agentId) where.agentId = agentId;
    return this.metricRepo.find({ where, order: { createdAt: 'DESC' }, take: limit });
  }

  async getDashboardStats() {
    const [agents, tools, workflows] = await Promise.all([
      this.agentRepo.find(),
      this.toolRepo.find(),
      this.workflowRepo.find(),
    ]);

    const [metricAgg, recentMetrics] = await Promise.all([
      this.metricRepo
        .createQueryBuilder('m')
        .select('COUNT(m.id)', 'totalMetrics')
        .addSelect('SUM(CASE WHEN m.success = true THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(m.totalExecutions)', 'totalExecutions')
        .getRawOne(),
      this.metricRepo.find({ order: { createdAt: 'DESC' }, take: 50 }),
    ]);

    const totalExecutions = agents.reduce((s, a) => s + Number(a.totalExecutions), 0);

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.isEnabled).length,
      agentsByCategory: this.groupBy(agents, 'category'),
      totalTools: tools.length,
      activeTools: tools.filter(t => t.isEnabled).length,
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.isEnabled).length,
      totalExecutions,
      recentMetrics,
      successRate: (parseInt(metricAgg?.totalMetrics, 10) || 0) > 0
        ? (((parseInt(metricAgg?.successCount, 10) || 0) / (parseInt(metricAgg?.totalMetrics, 10) || 1)) * 100).toFixed(1) + '%'
        : 'N/A',
    };
  }

  async recordMetric(agentId: string, agentName: string, eventType: string, payload: Record<string, unknown>, latencyMs: number, success: boolean, errorMessage?: string) {
    try {
      const metric = this.metricRepo.create({ agentId, agentName, eventType, payload, latencyMs, success, errorMessage, costEstimate: 0 });
      await this.metricRepo.save(metric);

      if (agentId) {
        const agent = await this.agentRepo.findOne({ where: { id: agentId } });
        if (agent) {
          agent.totalExecutions = Number(agent.totalExecutions) + 1;
          const recentMetrics = await this.metricRepo.find({
            where: { agentId }, order: { createdAt: 'DESC' }, take: 20,
          });
          agent.successRate = recentMetrics.filter(m => m.success).length / Math.max(1, recentMetrics.length) * 100;
          agent.avgLatencyMs = recentMetrics.reduce((s, m) => s + Number(m.latencyMs), 0) / Math.max(1, recentMetrics.length);
          agent.lastRunAt = new Date();
          await this.agentRepo.save(agent);
        }
      }
    } catch {}
  }

  private async callToolEndpoint(tool: AgentTool, input: Record<string, unknown>) {
    const url = tool.endpoint;
    const method = tool.httpMethod.toLowerCase();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(tool.headers || {}) };
    const fetchInit: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(tool.timeoutMs || 15000),
    };
    if (method !== 'get' && method !== 'head') {
      fetchInit.body = JSON.stringify(input);
    }
    const resp = await fetch(url, fetchInit);
    if (!resp.ok) throw new Error(`Tool ${tool.name} returned ${resp.status}`);
    return resp.json();
  }

  private groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of arr) {
      const val = String(item[key] || 'unknown');
      result[val] = (result[val] || 0) + 1;
    }
    return result;
  }
}
