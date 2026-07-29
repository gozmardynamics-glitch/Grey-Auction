import { OpenAICompatibleProvider } from './openai-compatible.base';
import { AIProviderConfig } from '../interfaces/ai-provider.interface';

export class ZhipuProvider extends OpenAICompatibleProvider {
  name = 'zhipu';

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
    });
  }
}
