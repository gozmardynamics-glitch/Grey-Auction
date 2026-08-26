import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../../ai/ai.service';
import { LLMModel } from '../../../ai/entities/llm-model.entity';
import { ProviderStatus } from '../../../ai/entities/llm-provider.entity';
import { AIUsageLogService } from './ai-usage-log.service';
import { AIProvider, ChatCompletionRequest } from '../interfaces/ai-provider.interface';
import { OpenAICompatibleProvider } from '../providers/openai-compatible.base';
import { ClaudeProvider } from '../providers/claude.provider';
import { GeminiProvider } from '../providers/gemini.provider';

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

  private createProviderFromRecord(model: LLMModel): AIProvider {
    const provider = model.provider;
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
