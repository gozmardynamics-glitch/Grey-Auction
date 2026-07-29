import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class NvidiaProvider extends OpenAICompatibleProvider {
  name = 'nvidia';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://integrate.api.nvidia.com/v1',
    });
  }
}
