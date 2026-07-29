import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  name = 'deepseek';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
    });
  }
}
