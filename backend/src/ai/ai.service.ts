import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LLMProvider, ProviderStatus, ProviderType } from './entities/llm-provider.entity';
import { LLMModel } from './entities/llm-model.entity';
import { AIFeatureConfig } from './entities/ai-feature-config.entity';
import { AIUsageLog } from './entities/ai-usage-log.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CreateFeatureConfigDto } from './dto/create-feature-config.dto';
import { UpdateFeatureConfigDto } from './dto/update-feature-config.dto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    @InjectRepository(LLMProvider) private readonly providerRepo: Repository<LLMProvider>,
    @InjectRepository(LLMModel) private readonly modelRepo: Repository<LLMModel>,
    @InjectRepository(AIFeatureConfig) private readonly featureRepo: Repository<AIFeatureConfig>,
    @InjectRepository(AIUsageLog) private readonly usageRepo: Repository<AIUsageLog>,
  ) {}

  async findAllProviders() {
    return this.providerRepo.find({
      relations: ['models'],
      order: { createdAt: 'DESC' },
    });
  }

  async recordHealth(providerId: string, result: { success: boolean; latencyMs?: number; modelCount?: number }) {
    const provider = await this.findProviderById(providerId);

    let consecutiveFailures = provider.consecutiveFailures || 0;
    let status: ProviderStatus;

    if (result.success) {
      status = ProviderStatus.HEALTHY;
      consecutiveFailures = 0;
    } else {
      consecutiveFailures += 1;
      status = consecutiveFailures >= 3 ? ProviderStatus.DOWN : ProviderStatus.DEGRADED;
    }

    await this.providerRepo.update(providerId, {
      status,
      consecutiveFailures,
      lastCheckedAt: new Date(),
      lastLatencyMs: result.latencyMs ?? null,
    });

    return this.findProviderById(providerId);
  }

  async healthSummary() {
    const providers = await this.findAllProviders();
    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      baseUrl: p.baseUrl,
      tier: p.tier,
      providerType: p.providerType,
      isActive: p.isActive,
      configured: Boolean(p.apiKey),
      status: p.status,
      lastCheckedAt: p.lastCheckedAt,
      lastLatencyMs: p.lastLatencyMs,
      consecutiveFailures: p.consecutiveFailures,
      modelCount: p.models?.length || 0,
    }));
  }

  /**
   * Connectivity test for one provider, protocol-aware:
   * - openai family: GET {base}/models with Authorization: Bearer
   * - anthropic:     GET {base}/models with x-api-key + anthropic-version
   * - gemini:        GET {base}/models?key=...
   * Providers without an API key are reported as unconfigured (not DOWN).
   */
  async testConnection(provider: LLMProvider): Promise<{
    ok: boolean;
    configured: boolean;
    modelCount: number;
    latencyMs: number;
    statusCode: number | null;
    message: string;
  }> {
    const startTime = Date.now();
    const base = (provider.baseUrl || '').replace(/\/$/, '');

    if (!provider.apiKey) {
      return {
        ok: false,
        configured: false,
        modelCount: 0,
        latencyMs: 0,
        statusCode: null,
        message: 'No API key configured — provider is not connected',
      };
    }

    let url = base + '/models';
    const headers: Record<string, string> = {
      ...(provider.headers || {}),
    };

    if (provider.providerType === ProviderType.ANTHROPIC) {
      headers['x-api-key'] = provider.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider.providerType === ProviderType.GEMINI) {
      url += '?key=' + encodeURIComponent(provider.apiKey);
    } else {
      headers.Authorization = 'Bearer ' + provider.apiKey;
    }

    try {
      const resp = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Date.now() - startTime;
      let modelCount = 0;
      let message = resp.ok ? 'Connection successful' : 'Connection failed';
      if (resp.ok) {
        const data: any = await resp.json().catch(() => ({}));
        modelCount = data?.data?.length || data?.models?.length || 0;
      }
      return {
        ok: resp.ok,
        configured: true,
        modelCount,
        latencyMs,
        statusCode: resp.status,
        message,
      };
    } catch (err: any) {
      return {
        ok: false,
        configured: true,
        modelCount: 0,
        latencyMs: Date.now() - startTime,
        statusCode: null,
        message: err?.message || 'Connection error',
      };
    }
  }

  /** Sweep all active providers; detect connectivity and record health. */
  async monitorSweep(): Promise<Array<{ id: string; name: string; ok: boolean; configured: boolean; latencyMs: number; status: ProviderStatus }>> {
    const providers = await this.findAllProviders();
    const results = [];
    for (const provider of providers) {
      if (!provider.isActive) continue;

      const test = await this.testConnection(provider);
      let outcome: { success: boolean } = { success: false };
      let finalStatus = provider.status;

      if (!test.configured) {
        // Leave status as-is (unknown) — not configured is not 'down'
        results.push({
          id: provider.id,
          name: provider.name,
          ok: false,
          configured: false,
          latencyMs: 0,
          status: provider.status,
        });
        continue;
      }

      outcome = { success: test.ok };
      const updated = await this.recordHealth(provider.id, {
        success: test.ok,
        latencyMs: test.latencyMs,
        modelCount: test.modelCount,
      });
      finalStatus = updated.status;
      results.push({
        id: provider.id,
        name: provider.name,
        ok: test.ok,
        configured: true,
        latencyMs: test.latencyMs,
        status: finalStatus,
      });
    }
    return results;
  }

  async findProviderById(id: string) {
    const provider = await this.providerRepo.findOne({ where: { id }, relations: ['models'] });
    if (!provider) throw new NotFoundException(`Provider ${id} not found`);
    return provider;
  }

  async createProvider(dto: CreateProviderDto) {
    return this.providerRepo.save(this.providerRepo.create(dto));
  }

  async updateProvider(id: string, dto: UpdateProviderDto) {
    await this.providerRepo.update(id, dto);
    return this.findProviderById(id);
  }

  async removeProvider(id: string) {
    const provider = await this.findProviderById(id);
    await this.providerRepo.remove(provider);
  }

  async findModelsByProvider(providerId: string) {
    await this.findProviderById(providerId);
    return this.modelRepo.find({ where: { providerId }, order: { createdAt: 'DESC' } });
  }

  async findModelById(providerId: string, modelId: string) {
    const model = await this.modelRepo.findOne({ where: { id: modelId, providerId } });
    if (!model) throw new NotFoundException(`Model ${modelId} not found`);
    return model;
  }

  async createModel(providerId: string, dto: CreateModelDto) {
    const provider = await this.findProviderById(providerId);
    return this.modelRepo.save(this.modelRepo.create({ ...dto, provider }));
  }

  async updateModel(providerId: string, modelId: string, dto: Partial<CreateModelDto>) {
    await this.findProviderById(providerId);
    await this.modelRepo.update(modelId, { ...dto, providerId });
    return this.findModelById(providerId, modelId);
  }

  async removeModel(providerId: string, modelId: string) {
    const model = await this.findModelById(providerId, modelId);
    await this.modelRepo.remove(model);
  }

  async findAllFeatures() {
    return this.featureRepo.find({
      relations: ['primaryModel', 'fallbackModel', 'tertiaryModel'],
      order: { section: 'ASC', featureKey: 'ASC' },
    });
  }

  async findFeatureById(id: string) {
    const feature = await this.featureRepo.findOne({
      where: { id },
      relations: ['primaryModel', 'fallbackModel', 'tertiaryModel'],
    });
    if (!feature) throw new NotFoundException(`Feature config ${id} not found`);
    return feature;
  }

  async findFeatureByKey(featureKey: string) {
    const feature = await this.featureRepo.findOne({
      where: { featureKey },
      relations: ['primaryModel', 'fallbackModel', 'tertiaryModel'],
    });
    return feature;
  }

  async createFeatureConfig(dto: CreateFeatureConfigDto) {
    return this.featureRepo.save(this.featureRepo.create(dto));
  }

  async updateFeatureConfig(id: string, dto: UpdateFeatureConfigDto) {
    await this.featureRepo.update(id, dto);
    return this.findFeatureById(id);
  }

  async findUsageLogs(query: { dateFrom?: string; dateTo?: string; feature?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (query.dateFrom || query.dateTo) {
      where.createdAt = Between(
        query.dateFrom ? new Date(query.dateFrom) : new Date('2000-01-01'),
        query.dateTo ? new Date(query.dateTo) : new Date(),
      );
    }
    if (query.feature) {
      where.featureKey = query.feature;
    }
    const page = query.page || 1;
    const limit = query.limit || 50;
    return this.usageRepo.find({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findUsageSummary() {
    const raw = await this.usageRepo
      .createQueryBuilder('log')
      .select('SUM(log.promptTokens + log.completionTokens)', 'totalTokens')
      .addSelect('SUM(log.estimatedCost)', 'totalCost')
      .addSelect('log.providerName', 'providerName')
      .groupBy('log.providerName')
      .getRawMany();

    let totalTokens = 0;
    let totalCost = 0;
    const byProvider: Record<string, { tokens: number; cost: number }> = {};

    for (const row of raw) {
      const tokens = parseInt(row.totalTokens, 10) || 0;
      const cost = parseFloat(row.totalCost) || 0;
      const key = row.providerName || 'unknown';
      totalTokens += tokens;
      totalCost += cost;
      byProvider[key] = { tokens, cost };
    }

    return { totalTokens, totalCost, byProvider };
  }

  async createUsageLog(dto: Partial<AIUsageLog>) {
    return this.usageRepo.save(this.usageRepo.create(dto));
  }
}
