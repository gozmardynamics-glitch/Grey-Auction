import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class MiniMaxProvider extends OpenAICompatibleProvider {
  name = 'minimax';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.minimax.chat/v1',
    });
  }
}
