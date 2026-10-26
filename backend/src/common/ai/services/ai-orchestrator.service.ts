import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../../ai/ai.service';
import { LLMModel } from '../../../ai/entities/llm-model.entity';
import { ProviderStatus } from '../../../ai/entities/llm-provider.entity';
import { AIUsageLogService } from './ai-usage-log.service';
import { AIProvider, ChatCompletionRequest } from '../interfaces/ai-provider.interface';
import { OpenAICompatibleProvider } from '../providers/openai-compatible.base';
import { ClaudeProvider } from '../providers/claude.provider';
import { GeminiProvider } from '../providers/gemini.provider';

/** Numeric coercion with a fallback for null/undefined/NaN. */
function toNumberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface AIFeatureInput {
  messages?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  prompt?: string;
  [key: string]: unknown;
}

export interface AIFeatureOutput {
  output: string;
  modelUsed: string;
  providerName: string;
  latencyMs: number;
}

@Injectable()
export class AIOrchestratorService {
  private readonly logger = new Logger(AIOrchestratorService.name);
  private readonly rateLimitBuckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private readonly aiService: AIService,
    private readonly usageLogService: AIUsageLogService,
  ) {}

  async execute(featureKey: string, input: AIFeatureInput, userId?: string): Promise<AIFeatureOutput> {
    const feature = await this.aiService.findFeatureByKey(featureKey);

    if (!feature || !feature.isEnabled) {
      throw new Error(`AI feature '${featureKey}' is not enabled`);
    }

    this.checkRateLimit(featureKey, feature.rateLimitPerMinute || 10, feature.rateLimitPerDay || 1000);

    const modelChain = [
      feature.primaryModel,
      feature.fallbackModel,
      feature.tertiaryModel,
    ].filter(Boolean) as LLMModel[];

    // Health-aware ordering: push providers marked 'down' to the end,
    // otherwise preserve primary -> fallback -> tertiary order.
    const orderedChain = [...modelChain].sort((a, b) => {
      const aDown = a.provider?.status === ProviderStatus.DOWN ? 1 : 0;
      const bDown = b.provider?.status === ProviderStatus.DOWN ? 1 : 0;
      return aDown - bDown;
    });

    if (orderedChain.length === 0) {
      throw new Error(`No models configured for feature '${featureKey}'`);
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    if (feature.systemPrompt) {
      messages.push({ role: 'system', content: feature.systemPrompt });
    }

    if (input.messages && input.messages.length > 0) {
      messages.push(...input.messages);
    } else if (input.prompt) {
      messages.push({ role: 'user', content: input.prompt });
    } else {
      messages.push({ role: 'user', content: JSON.stringify(input) });
    }

    let lastError: Error | null = null;
    let attemptNumber = 0;

    for (const model of orderedChain) {
      attemptNumber++;
      const startTime = Date.now();

      try {
        const provider = this.createProviderFromRecord(model);
        const req: ChatCompletionRequest = {
          model: model.modelId,
          messages,
          temperature: Number(feature.temperature) || 0.7,
          maxTokens: feature.maxTokens || 2048,
        };

        const result = await provider.chat(req);
        const latencyMs = Date.now() - startTime;

        const cost = this.estimateCost(model, result.usage?.promptTokens || 0, result.usage?.completionTokens || 0);

        await this.usageLogService.log({
          featureKey,
          modelId: model.modelId,
          providerName: model.provider?.name || provider.name,
          userId,
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          estimatedCost: cost,
          latencyMs,
          success: true,
          attemptNumber,
        });

        return {
          output: result.content,
          modelUsed: model.modelId,
          providerName: model.provider?.name || provider.name,
          latencyMs,
        };
      } catch (err: any) {
        lastError = err;
        const latencyMs = Date.now() - startTime;

        await this.usageLogService.log({
          featureKey,
          modelId: model.modelId,
          providerName: model.provider?.name,
          userId,
          promptTokens: 0,
          completionTokens: 0,
          estimatedCost: 0,
          latencyMs,
          success: false,
          errorMessage: err.message,
          attemptNumber,
        });

        this.logger.warn(
          `[${featureKey}] Attempt ${attemptNumber}/${orderedChain.length} with ${model.modelId} failed: ${err.message}`,
        );
      }
    }

    throw lastError || new Error(`All models failed for feature '${featureKey}'`);
  }

  /**
   * Run a single call against an explicit registry entry.
   *
   * Used by agents, which configure their own provider/model (including custom
   * OpenAI-compatible providers an admin registered) instead of depending on a
   * feature key. The provider is resolved from the llm_providers row, so any
   * base URL, key and protocol in the registry works — no code change needed.
   */
  async executeWithModel(params: {
    providerName?: string;
    providerId?: string;
    modelId?: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
    /** Attribution label for the usage log, e.g. `agent:<name>`. */
    label: string;
    userId?: string;
  }): Promise<{
    output: string;
    modelUsed: string;
    providerName: string;
    latencyMs: number;
    usage?: { promptTokens?: number; completionTokens?: number };
  }> {
    if (!params.providerName && !params.providerId) {
      throw new Error(
        'No provider configured. Set providerName (or providerId) to a provider registered under AI Providers.',
      );
    }

    const provider: any = params.providerId
      ? await this.aiService.findProviderById(params.providerId)
      : await this.aiService.findProviderByNameOrFail(params.providerName as string);

    if (!provider) {
      throw new Error(`Provider '${params.providerName}' is not registered`);
    }
    if (provider.isActive === false) {
      throw new Error(`Provider '${provider.name}' is disabled`);
    }

    const models: LLMModel[] = provider.models ?? [];
    if (models.length === 0) {
      throw new Error(
        `Provider '${provider.name}' has no models yet — add one under AI Providers before using it.`,
      );
    }

    let model: LLMModel | undefined;
    if (params.modelId) {
      model =
        models.find((m) => m.modelId === params.modelId) ??
        models.find((m) => m.id === params.modelId);
      if (!model) {
        throw new Error(
          `Model '${params.modelId}' is not registered under provider '${provider.name}'. Available: ${models
            .map((m) => m.modelId)
            .join(', ')}`,
        );
      }
    } else {
      model = models.find((m) => m.isActive !== false) ?? models[0];
    }

    const startTime = Date.now();
    const adapter = this.createProviderFromRecord(model as LLMModel, provider);
    const result = await adapter.chat({
      model: model.modelId,
      messages: params.messages,
      temperature: params.temperature ?? toNumberOr(model.defaultTemperature, 0.7),
      maxTokens: params.maxTokens ?? toNumberOr(model.maxOutputTokens, 2048),
    });
    const latencyMs = Date.now() - startTime;

    const promptTokens = result.usage?.promptTokens || 0;
    const completionTokens = result.usage?.completionTokens || 0;

    await this.usageLogService.log({
      featureKey: params.label,
      modelId: model.modelId,
      providerName: provider.name,
      userId: params.userId,
      promptTokens,
      completionTokens,
      estimatedCost: this.estimateCost(model, promptTokens, completionTokens),
      latencyMs,
      success: true,
      attemptNumber: 1,
    });

    return {
      output: result.content,
      modelUsed: model.modelId,
      providerName: provider.name,
      latencyMs,
      usage: result.usage,
    };
  }

  private createProviderFromRecord(model: LLMModel, providerOverride?: unknown): AIProvider {
    // The provider may be supplied by the caller: a model loaded through the
    // provider relation has no back-reference of its own.
    const provider = (providerOverride ?? model.provider) as LLMModel['provider'];
    if (!provider) throw new Error('Model has no associated provider');

    const config = {
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      headers: provider.headers,
    };

    const type = (provider as any).providerType;
    switch (type || provider.name.toLowerCase()) {
      case 'anthropic':
        return new ClaudeProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      default:
        return this.createGenericOpenAIProvider(config);
    }
  }

  private createGenericOpenAIProvider(config: any): AIProvider {
    const provider = new (class extends OpenAICompatibleProvider {
      name: string;
      constructor(cfg: any) {
        super(cfg);
        this.name = cfg.name;
      }
    })(config);
    return provider;
  }

  private estimateCost(model: LLMModel, promptTokens: number, completionTokens: number): number {
    const inputPrice = Number(model.inputPricePerMillion) || 0;
    const outputPrice = Number(model.outputPricePerMillion) || 0;
    return (promptTokens / 1_000_000) * inputPrice + (completionTokens / 1_000_000) * outputPrice;
  }

  private checkRateLimit(featureKey: string, perMinute: number, perDay: number): void {
    const now = Date.now();
    let bucket = this.rateLimitBuckets.get(featureKey);

    if (!bucket) {
      bucket = { tokens: perMinute, lastRefill: now };
      this.rateLimitBuckets.set(featureKey, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(perMinute, bucket.tokens + (elapsed / 60000) * perMinute);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      throw new Error(`Rate limit exceeded for feature '${featureKey}'. Try again shortly.`);
    }

    bucket.tokens--;
  }
}
