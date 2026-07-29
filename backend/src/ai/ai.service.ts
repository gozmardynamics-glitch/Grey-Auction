import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LLMProvider } from './entities/llm-provider.entity';
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

  async findUsageLogs(query: { dateFrom?: string; dateTo?: string; feature?: string }) {
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
    return this.usageRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
  }

  async findUsageSummary() {
    const logs = await this.usageRepo.find();
    const totalTokens = logs.reduce((sum, l) => sum + l.promptTokens + l.completionTokens, 0);
    const totalCost = logs.reduce((sum, l) => sum + Number(l.estimatedCost), 0);
    const byProvider: Record<string, { tokens: number; cost: number }> = {};
    for (const l of logs) {
      const key = l.providerName || 'unknown';
      if (!byProvider[key]) byProvider[key] = { tokens: 0, cost: 0 };
      byProvider[key].tokens += l.promptTokens + l.completionTokens;
      byProvider[key].cost += Number(l.estimatedCost);
    }
    return { totalTokens, totalCost, byProvider };
  }

  async createUsageLog(dto: Partial<AIUsageLog>) {
    return this.usageRepo.save(this.usageRepo.create(dto));
  }
}
