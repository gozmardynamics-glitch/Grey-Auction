import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMProvider, ProviderType } from '../../ai/entities/llm-provider.entity';
import { LLMModel } from '../../ai/entities/llm-model.entity';

/**
 * Seeds the LLM provider registry with the configured provider set.
 * Providers are created WITHOUT API keys (the admin adds keys in the UI);
 * representative models are added per provider so fallback chains work.
 * Idempotent: existing providers are left untouched unless they lack models.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const providerRepo: Repository<LLMProvider> = app.get(getRepositoryToken(LLMProvider));
  const modelRepo: Repository<LLMModel> = app.get(getRepositoryToken(LLMModel));

  console.log('Seeding LLM providers...');

  const PROVIDERS = [
    { name: 'deepseek', displayName: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', providerType: ProviderType.OPENAI, models: ['deepseek-chat', 'deepseek-reasoner'] },
    { name: 'qwen', displayName: 'Qwen (Alibaba DashScope)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', providerType: ProviderType.OPENAI, models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
    { name: 'wan', displayName: 'Wan (Alibaba DashScope)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', providerType: ProviderType.OPENAI, models: ['wan2.2-t2v-plus', 'wanx2.1-t2i-turbo'] },
    { name: 'openrouter', displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', providerType: ProviderType.OPENAI, models: ['openrouter/auto', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku'] },
    { name: 'gemini', displayName: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', providerType: ProviderType.GEMINI, models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
    { name: 'openai', displayName: 'OpenAI', baseUrl: 'https://api.openai.com/v1', providerType: ProviderType.OPENAI, models: ['gpt-4o-mini', 'gpt-4o'] },
    { name: 'anthropic', displayName: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', providerType: ProviderType.ANTHROPIC, models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'] },
    { name: 'poolside', displayName: 'Poolside', baseUrl: 'https://api.poolside.ai/v1', providerType: ProviderType.OPENAI, models: ['poolside-1.0'] },
  ];

  for (const def of PROVIDERS) {
    let provider = await providerRepo.findOne({ where: { name: def.name } });
    if (!provider) {
      provider = await providerRepo.save(providerRepo.create({
        name: def.name,
        displayName: def.displayName,
        baseUrl: def.baseUrl,
        apiKey: '',
        providerType: def.providerType,
        isActive: true,
      }));
      console.log('  + provider: ' + def.name);
    } else {
      // Keep base URL + type in sync with presets if the admin has not customised them
      if (!provider.baseUrl) { provider.baseUrl = def.baseUrl; await providerRepo.save(provider); }
      console.log('  = provider exists: ' + def.name);
    }

    for (const modelId of def.models) {
      const exists = await modelRepo.findOne({ where: { providerId: provider.id, modelId } });
      if (!exists) {
        const displayName = modelId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        await modelRepo.save(modelRepo.create({ providerId: provider.id, modelId, displayName, isActive: true }));
        console.log('    - model: ' + def.name + '/' + modelId);
      }
    }
  }

  console.log('Provider seeding complete: ' + PROVIDERS.length + ' providers configured');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});