import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { LLMProvider, ProviderType } from './entities/llm-provider.entity';
import { LLMModel } from './entities/llm-model.entity';
import { AIFeatureConfig } from './entities/ai-feature-config.entity';
import { AIUsageLog } from './entities/ai-usage-log.entity';

describe('AIService testConnection (protocol-aware)', () => {
  let service: AIService;
  const repos = {
    provider: { find: jest.fn(), findOne: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() },
    model: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn(), update: jest.fn() },
    feature: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() },
    usage: { find: jest.fn(), create: jest.fn(), save: jest.fn() },
  };
  const makeProvider = (over: Partial<any> = {}): any => ({
    id: 'p1', name: 'x', baseUrl: 'https://x.example/v1', apiKey: '', providerType: ProviderType.OPENAI, headers: {}, ...over,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: getRepositoryToken(LLMProvider), useValue: repos.provider },
        { provide: getRepositoryToken(LLMModel), useValue: repos.model },
        { provide: getRepositoryToken(AIFeatureConfig), useValue: repos.feature },
        { provide: getRepositoryToken(AIUsageLog), useValue: repos.usage },
      ],
    }).compile();
    service = module.get<AIService>(AIService);
  });

  it('reports unconfigured when no API key is set (never marks down)', async () => {
    const res = await service.testConnection(makeProvider({ apiKey: '' }));
    expect(res.ok).toBe(false);
    expect(res.configured).toBe(false);
    expect(res.message).toContain('No API key');
  });

  it('uses Bearer auth for the openai family', async () => {
    const calls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation(async (url: string, init: any) => {
      calls.push({ url, headers: init?.headers });
      return { ok: true, status: 200, json: async () => ({ data: [{ id: 'a' }, { id: 'b' }] }) };
    });
    const res = await service.testConnection(makeProvider({ apiKey: 'sk-test' }));
    expect(res.ok).toBe(true);
    expect(res.modelCount).toBe(2);
    expect(calls[0].headers.Authorization).toBe('Bearer sk-test');
    delete (global as any).fetch;
  });

  it('uses x-api-key + anthropic-version for Anthropic', async () => {
    const calls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation(async (url: string, init: any) => {
      calls.push({ url, headers: init?.headers });
      return { ok: true, status: 200, json: async () => ({ data: [{ id: 'a' }] }) };
    });
    const res = await service.testConnection(makeProvider({ providerType: ProviderType.ANTHROPIC, apiKey: 'ak-test' }));
    expect(res.ok).toBe(true);
    expect(calls[0].headers['x-api-key']).toBe('ak-test');
    expect(calls[0].headers['anthropic-version']).toBe('2023-06-01');
    delete (global as any).fetch;
  });

  it('uses the key query parameter for Gemini', async () => {
    const calls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation(async (url: string, init: any) => {
      calls.push({ url, headers: init?.headers });
      return { ok: true, status: 200, json: async () => ({ models: [{ name: 'models/gemini-2.0-flash' }] }) };
    });
    const res = await service.testConnection(makeProvider({ providerType: ProviderType.GEMINI, apiKey: 'gk-test' }));
    expect(res.ok).toBe(true);
    expect(calls[0].url).toContain('?key=gk-test');
    expect(calls[0].headers.Authorization).toBeUndefined();
    delete (global as any).fetch;
  });

  it('records failure without a crash on network errors', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await service.testConnection(makeProvider({ apiKey: 'sk-x' }));
    expect(res.ok).toBe(false);
    expect(res.message).toContain('ECONNREFUSED');
    delete (global as any).fetch;
  });
});