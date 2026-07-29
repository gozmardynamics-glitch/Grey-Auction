import { AIProvider, AIProviderConfig, ChatCompletionRequest, ChatCompletionResponse } from '../interfaces/ai-provider.interface';

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.baseUrl = (config.baseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '');
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const systemMsg = req.messages.find(m => m.role === 'system');
    const chatMsgs = req.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.7,
      messages: chatMsgs.map(m => ({ role: m.role, content: m.content })) as unknown as { role: string; content: string }[],
    };
    if (systemMsg) body.system = systemMsg.content;
    if (req.responseFormat === 'json_object') {
      const msgs = (body.messages as { role: string; content: string }[]);
      for (const msg of msgs) {
        if (msg.role === 'user') {
          msg.content = msg.content + '\n\nRespond ONLY with valid JSON.';
        }
      }
      const preamble = msgs.find(m => m.role === 'assistant');
      if (preamble) {
        msgs.unshift({ role: 'assistant', content: '{' });
      } else {
        msgs.push({ role: 'assistant', content: '{' });
      }
    }

    const url = `${this.baseUrl}/messages`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        ...(this.config.headers || {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`[claude] ${resp.status} ${resp.statusText}: ${errText}`);
    }

    const data = await resp.json() as any;
    let content = '';
    for (const block of (data?.content || [])) {
      if (block.type === 'text') content += block.text;
    }

    return {
      content,
      model: data?.model || req.model,
      usage: data?.usage ? {
        promptTokens: data.usage.input_tokens || 0,
        completionTokens: data.usage.output_tokens || 0,
      } : undefined,
    };
  }

  async chatJSON<T = Record<string, unknown>>(req: Omit<ChatCompletionRequest, 'responseFormat'>): Promise<T> {
    const result = await this.chat({ ...req, responseFormat: 'json_object' });
    try {
      return JSON.parse(result.content.replace(/^{/, '{').replace(/}$/, '}')) as T;
    } catch {
      return {} as T;
    }
  }

  async *chatStream(req: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const systemMsg = req.messages.find(m => m.role === 'system');
    const chatMsgs = req.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.7,
      messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };
    if (systemMsg) body.system = systemMsg.content;

    const url = `${this.baseUrl}/messages`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        ...(this.config.headers || {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`[claude] ${resp.status} ${resp.statusText}: ${errText}`);
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
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<string[]> {
    return ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-3-5-20241022'];
  }

  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          ...(this.config.headers || {}),
        },
        body: JSON.stringify({
          model: 'claude-haiku-3-5-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(10000),
      });
      return resp.ok || resp.status === 429;
    } catch {
      return false;
    }
  }
}
