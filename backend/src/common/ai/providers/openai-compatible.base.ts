import { AIProvider, AIProviderConfig, ChatCompletionRequest, ChatCompletionResponse } from '../interfaces/ai-provider.interface';

export abstract class OpenAICompatibleProvider implements AIProvider {
  abstract name: string;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
      ...(this.config.headers || {}),
    };
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
      stream: false,
    };
    if (req.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const url = `${this.getBaseUrl()}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`[${this.name}] ${resp.status} ${resp.statusText}: ${errText}`);
    }

    const data = await resp.json() as any;
    const choice = data?.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data?.model || req.model,
      usage: data?.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
      } : undefined,
    };
  }

  async chatJSON<T = Record<string, unknown>>(req: Omit<ChatCompletionRequest, 'responseFormat'>): Promise<T> {
    const result = await this.chat({ ...req, responseFormat: 'json_object' });
    try {
      return JSON.parse(result.content) as T;
    } catch {
      return {} as T;
    }
  }

  async *chatStream(req: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const body = {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
      stream: true,
    };

    const url = `${this.getBaseUrl()}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`[${this.name}] ${resp.status} ${resp.statusText}: ${errText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<string[]> {
    const url = `${this.getBaseUrl()}/models`;
    const resp = await fetch(url, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    return (data?.data || []).map((m: any) => m.id).filter(Boolean) as string[];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}
