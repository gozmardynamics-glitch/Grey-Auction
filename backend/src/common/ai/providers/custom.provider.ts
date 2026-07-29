import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class CustomProvider extends OpenAICompatibleProvider {
  name = 'custom';

  constructor(config: AIProviderConfig) {
    super(config);
  }
}
