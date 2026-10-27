import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentsService } from './agents.service';
import { AgentInstance } from './entities/agent-instance.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentWorkflow } from './entities/agent-workflow.entity';
import { AgentMetric } from './entities/agent-metric.entity';
import { LLMProvider } from '../ai/entities/llm-provider.entity';
import { LLMModel } from '../ai/entities/llm-model.entity';

describe('AgentsService dashboard', () => {
  let service: AgentsService;

  /** Query builder that records the SELECT list so we can assert on it. */
  const selects: string[] = [];
  const metricRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn(function (this: unknown, expr: string) {
        selects.push(expr);
        return this;
      }),
      addSelect: jest.fn(function (this: unknown, expr: string) {
        selects.push(expr);
        return this;
      }),
      getRawOne: jest.fn(async () => ({ totalMetrics: '4', successCount: '3' })),
    })),
    find: jest.fn(async () => []),
  };
  const agentRepo = { find: jest.fn(async () => [{ totalExecutions: 10, isEnabled: true, category: 'ops' }, { totalExecutions: null, isEnabled: false, category: 'ops' }]) };
  const toolRepo = { find: jest.fn(async () => []) };
  const workflowRepo = { find: jest.fn(async () => []) };

  beforeEach(async () => {
    jest.clearAllMocks();
    selects.length = 0;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: getRepositoryToken(AgentInstance), useValue: agentRepo },
        { provide: getRepositoryToken(AgentTool), useValue: toolRepo },
        { provide: getRepositoryToken(AgentWorkflow), useValue: workflowRepo },
        { provide: getRepositoryToken(AgentMetric), useValue: metricRepo },
        { provide: getRepositoryToken(LLMProvider), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(LLMModel), useValue: { find: jest.fn() } },
      ],
    }).compile();
    service = module.get<AgentsService>(AgentsService);
  });

  it('returns the dashboard instead of crashing on a non-existent column', async () => {
    // `agent_metrics.totalExecutions` does not exist; selecting it made the
    // whole endpoint answer 500 for every admin that opened the page.
    const stats = await service.getDashboardStats();

    expect(selects.join(' ')).not.toMatch(/totalExecutions/);
    expect(stats).toMatchObject({
      totalAgents: 2,
      activeAgents: 1,
      totalExecutions: 10,
      successRate: '75.0%',
    });
  });

  it('treats a missing execution count as zero rather than NaN', async () => {
    const stats = await service.getDashboardStats();

    expect(Number.isNaN(stats.totalExecutions)).toBe(false);
  });

  it('reports N/A when there are no metrics yet', async () => {
    (metricRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(async () => ({ totalMetrics: '0', successCount: null })),
    });

    const stats = await service.getDashboardStats();

    expect(stats.successRate).toBe('N/A');
  });
});
