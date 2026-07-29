import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class MoonshotProvider extends OpenAICompatibleProvider {
  name = 'moonshot';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.moonshot.cn/v1',
    });
  }
}
