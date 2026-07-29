import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class QwenProvider extends OpenAICompatibleProvider {
  name = 'qwen';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
  }
}
