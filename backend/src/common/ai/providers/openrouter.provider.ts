import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class OpenRouterProvider extends OpenAICompatibleProvider {
  name = 'openrouter';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
    });
  }
}
