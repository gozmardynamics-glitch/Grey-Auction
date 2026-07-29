import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class StepFunProvider extends OpenAICompatibleProvider {
  name = 'stepfun';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.stepfun.com/v1',
    });
  }
}
