import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class OpenAIProvider extends OpenAICompatibleProvider {
  name = 'openai';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
    });
  }
}
